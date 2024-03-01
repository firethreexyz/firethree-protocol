export type Firethree = {
  version: '0.1.0'
  name: 'firethree'
  instructions: [
    {
      name: 'createProject'
      accounts: [
        {
          name: 'signer'
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
            defined: 'CreateProjectArgs'
          }
        }
      ]
    },
    {
      name: 'deleteProject'
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
            name: 'authority'
            type: 'publicKey'
          }
        ]
      }
    }
  ]
  types: [
    {
      name: 'CreateProjectArgs'
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
    },
    {
      code: 6001
      name: 'InvalidShadowAccount'
      msg: 'Invalid shadow account'
    },
    {
      code: 6002
      name: 'InvalidAccount'
      msg: 'Invalid account'
    },
    {
      code: 6003
      name: 'Unauthorized'
      msg: 'Unauthorized access'
    }
  ]
}

export const IDL: Firethree = {
  version: '0.1.0',
  name: 'firethree',
  instructions: [
    {
      name: 'createProject',
      accounts: [
        {
          name: 'signer',
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
            defined: 'CreateProjectArgs'
          }
        }
      ]
    },
    {
      name: 'deleteProject',
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
            name: 'authority',
            type: 'publicKey'
          }
        ]
      }
    }
  ],
  types: [
    {
      name: 'CreateProjectArgs',
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
    },
    {
      code: 6001,
      name: 'InvalidShadowAccount',
      msg: 'Invalid shadow account'
    },
    {
      code: 6002,
      name: 'InvalidAccount',
      msg: 'Invalid account'
    },
    {
      code: 6003,
      name: 'Unauthorized',
      msg: 'Unauthorized access'
    }
  ]
}
