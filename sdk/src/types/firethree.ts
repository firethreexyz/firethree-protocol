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
          name: 'args'
          type: {
            defined: 'Project'
          }
        }
      ]
    },
    {
      name: 'deleteProject'
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
            name: 'multisigKey'
            type: 'publicKey'
          },
          {
            name: 'authority'
            type: 'publicKey'
          }
        ]
      }
    }
  ]
  errors: [
    {
      code: 6000
      name: 'Unauthorized'
      msg: 'Unauthorized'
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
          name: 'args',
          type: {
            defined: 'Project'
          }
        }
      ]
    },
    {
      name: 'deleteProject',
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
            name: 'multisigKey',
            type: 'publicKey'
          },
          {
            name: 'authority',
            type: 'publicKey'
          }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: 'Unauthorized',
      msg: 'Unauthorized'
    }
  ]
}
