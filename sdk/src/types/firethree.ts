export type Firethree = {
  version: '0.1.0'
  name: 'firethree'
  instructions: [
    {
      name: 'projectCreate'
      accounts: [
        {
          name: 'payer'
          isMut: true
          isSigner: true
        },
        {
          name: 'project'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'args'
          type: {
            defined: 'ProjectArgs'
          }
        }
      ]
    },
    {
      name: 'projectDelete'
      accounts: [
        {
          name: 'authority'
          isMut: true
          isSigner: true
        },
        {
          name: 'project'
          isMut: true
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: 'userCreate'
      accounts: [
        {
          name: 'payer'
          isMut: true
          isSigner: true
        },
        {
          name: 'user'
          isMut: true
          isSigner: false
        },
        {
          name: 'project'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: []
    }
  ]
  accounts: [
    {
      name: 'project'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'ts'
            type: 'i64'
          },
          {
            name: 'name'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'shdw'
            type: 'publicKey'
          },
          {
            name: 'multisig'
            type: 'publicKey'
          },
          {
            name: 'authority'
            type: 'publicKey'
          },
          {
            name: 'createKey'
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'user'
      type: {
        kind: 'struct'
        fields: []
      }
    }
  ]
  types: [
    {
      name: 'ProjectArgs'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'name'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'multisig'
            type: 'publicKey'
          },
          {
            name: 'createKey'
            type: 'publicKey'
          },
          {
            name: 'shdw'
            type: 'publicKey'
          }
        ]
      }
    }
  ]
  errors: [
    {
      code: 6000
      name: 'UnauthorizedToDeleteProject'
      msg: 'Unauthorized to delete the project'
    }
  ]
}

export const IDL: Firethree = {
  version: '0.1.0',
  name: 'firethree',
  instructions: [
    {
      name: 'projectCreate',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true
        },
        {
          name: 'project',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'ProjectArgs'
          }
        }
      ]
    },
    {
      name: 'projectDelete',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true
        },
        {
          name: 'project',
          isMut: true,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: 'userCreate',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false
        },
        {
          name: 'project',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: 'project',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'ts',
            type: 'i64'
          },
          {
            name: 'name',
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump',
            type: 'u8'
          },
          {
            name: 'shdw',
            type: 'publicKey'
          },
          {
            name: 'multisig',
            type: 'publicKey'
          },
          {
            name: 'authority',
            type: 'publicKey'
          },
          {
            name: 'createKey',
            type: 'publicKey'
          }
        ]
      }
    },
    {
      name: 'user',
      type: {
        kind: 'struct',
        fields: []
      }
    }
  ],
  types: [
    {
      name: 'ProjectArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'name',
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'multisig',
            type: 'publicKey'
          },
          {
            name: 'createKey',
            type: 'publicKey'
          },
          {
            name: 'shdw',
            type: 'publicKey'
          }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: 'UnauthorizedToDeleteProject',
      msg: 'Unauthorized to delete the project'
    }
  ]
}
