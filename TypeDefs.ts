export const typeDefs = `#graphql
  type Contacto {
    id: ID!
    nombre: String!
    telefono: String!
    pais: String!
    capital: String     # Opcional, sin !
    hora_capital: String  # Opcional, sin !
  }

  type Query {
    getContact(id: ID!): Contacto!
    getContacts: [Contacto!]!
  }

  type Mutation {
    addContact(nombre: String!, telefono: String!): Contacto!
    updateContact(id: ID!, nombre: String, telefono: String): Contacto!
    deleteContact(id: ID!): Boolean
  }
`
