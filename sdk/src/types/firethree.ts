export type Firethree = {
  version: '0.1.0'
  name: 'firethree'
  instructions: [
    {
      name: 'setupProject'
      accounts: [
        {
          name: 'user'
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
          name: 'params'
          type: {
            defined: 'Project'
          }
        }
      ]
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
            name: 'pubkey'
            type: 'publicKey'
          },
          {
            name: 'users'
            type: 'u32'
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
            name: 'vault'
            type: 'publicKey'
          },
          {
            name: 'isOnchain'
            type: 'bool'
          }
        ]
      }
    },
    {
      name: 'user'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'ts'
            type: 'i64'
          },
          {
            name: 'pubkey'
            type: 'publicKey'
          },
          {
            name: 'nick'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump'
            type: 'u8'
          },
          {
            name: 'project'
            type: 'publicKey'
          }
        ]
      }
    }
  ]
}

export const IDL: Firethree = {
  version: '0.1.0',
  name: 'firethree',
  instructions: [
    {
      name: 'setupProject',
      accounts: [
        {
          name: 'user',
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
          name: 'params',
          type: {
            defined: 'Project'
          }
        }
      ]
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
            name: 'pubkey',
            type: 'publicKey'
          },
          {
            name: 'users',
            type: 'u32'
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
            name: 'vault',
            type: 'publicKey'
          },
          {
            name: 'isOnchain',
            type: 'bool'
          }
        ]
      }
    },
    {
      name: 'user',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'ts',
            type: 'i64'
          },
          {
            name: 'pubkey',
            type: 'publicKey'
          },
          {
            name: 'nick',
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump',
            type: 'u8'
          },
          {
            name: 'project',
            type: 'publicKey'
          }
        ]
      }
    }
  ]
}
