import { Collection, ObjectId, MongoServerError } from "mongodb";
import { GraphQLError } from "graphql";
import { ContactModel } from "./type.ts";
import {
  validatePhone,
  getCapital,
  getLatLon,
  getLocalTime,
} from "./utils.ts";

type Context = { ContactCollection: Collection<ContactModel> };

type MutationAddArgs = { nombre: string; telefono: string };
type MutationUpdateArgs = { id: string; nombre?: string; telefono?: string };
type QueryIdArgs = { id: string };

export const resolvers = {
  Contacto: {
    id: (parent) => parent._id!.toString(),
    capital: (parent) => parent.capital ?? null,
    hora_capital: async (parent) => {
      if (!parent.capital) return null;
      try {
        const { lat, lon } = await getLatLon(parent.capital);
        return await getLocalTime(lat, lon);
      } catch {
        return null;
      }
    },
  },

  Query: {
    getContact: async (
      _: unknown,
      { id }: QueryIdArgs,
      { ContactCollection }: Context,
    ): Promise<ContactModel> => {
      const contact = await ContactCollection.findOne({ _id: new ObjectId(id) });
      if (!contact) throw new GraphQLError("El contacto no existe");
      return contact;
    },

    getContacts: async (
      _: unknown,
      __: unknown,
      { ContactCollection }: Context,
    ): Promise<ContactModel[]> => await ContactCollection.find({}).toArray(),
  },

  Mutation: {
    addContact: async (
      _: unknown,
      { nombre, telefono }: MutationAddArgs,
      { ContactCollection }: Context,
    ): Promise<ContactModel> => {
      const { is_valid, pais } = await validatePhone(telefono);
      if (!is_valid) throw new GraphQLError("El teléfono no es válido");

      const { capital, iso2 } = await getCapital(pais);
      const { lat, lon } = await getLatLon(capital);
      const hora_capital = await getLocalTime(lat, lon);

      try {
        const { insertedId } = await ContactCollection.insertOne({
          nombre,
          telefono,
          pais,
          iso2,
          capital,
          hora_capital,
        });
        return {
          _id: insertedId,
          nombre,
          telefono,
          pais,
          iso2,
          capital,
          hora_capital,
        };
      } catch (err) {
        if (err instanceof MongoServerError && err.code === 11000) {
          throw new GraphQLError("Ese teléfono ya está registrado");
        }
        throw err;
      }
    },

    deleteContact: async (
      _: unknown,
      { id }: QueryIdArgs,
      { ContactCollection }: Context,
    ): Promise<boolean> => {
      const { deletedCount } = await ContactCollection.deleteOne({
        _id: new ObjectId(id),
      });
      return deletedCount === 1;
    },

    updateContact: async (
      _: unknown,
      { id, nombre, telefono }: MutationUpdateArgs,
      { ContactCollection }: Context,
    ): Promise<ContactModel> => {
      const toUpdate: Partial<ContactModel> = {};

      if (nombre) toUpdate.nombre = nombre;

      if (telefono) {
        const { is_valid, pais } = await validatePhone(telefono);
        if (!is_valid) throw new GraphQLError("El nuevo teléfono no es válido");

        const { capital, iso2 } = await getCapital(pais);
        const { lat, lon } = await getLatLon(capital);
        const hora_capital = await getLocalTime(lat, lon);

        Object.assign(toUpdate, {
          telefono,
          pais,
          iso2,
          capital,
          hora_capital,
        });
      }

      if (Object.keys(toUpdate).length === 0) {
        throw new GraphQLError("No se proporcionó ningún dato para actualizar");
      }

      const result = await ContactCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: toUpdate },
        { returnDocument: "after" },
      );

      if (!result || !result.value) throw new GraphQLError("Contacto no encontrado");
      return result.value;
    },
  },
};
