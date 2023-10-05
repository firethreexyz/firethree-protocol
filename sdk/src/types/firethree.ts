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
          name: 'multisig'
          isMut: false
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
      name: 'projectDelete'
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
    },
    {
      name: 'multisig'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'createKey'
            docs: ['Key that is used to seed the multisig PDA.']
            type: 'publicKey'
          },
          {
            name: 'configAuthority'
            docs: [
              'The authority that can change the multisig config.',
              'This is a very important parameter as this authority can change the members and threshold.',
              '',
              'The convention is to set this to `Pubkey::default()`.',
              'In this case, the multisig becomes autonomous, so every config change goes through',
              'the normal process of voting by the members.',
              '',
              'However, if this parameter is set to any other key, all the config changes for this multisig',
              'will need to be signed by the `config_authority`. We call such a multisig a "controlled multisig".'
            ]
            type: 'publicKey'
          },
          {
            name: 'threshold'
            docs: ['Threshold for signatures.']
            type: 'u16'
          },
          {
            name: 'timeLock'
            docs: [
              'How many seconds must pass between transaction voting settlement and execution.'
            ]
            type: 'u32'
          },
          {
            name: 'transactionIndex'
            docs: [
              'Last transaction index. 0 means no transactions have been created.'
            ]
            type: 'u64'
          },
          {
            name: 'staleTransactionIndex'
            docs: [
              'Last stale transaction index. All transactions up until this index are stale.',
              'This index is updated when multisig config (members/threshold/time_lock) changes.'
            ]
            type: 'u64'
          },
          {
            name: 'reserved'
            docs: ['Reserved for future use.']
            type: 'u8'
          },
          {
            name: 'bump'
            docs: ['Bump for the multisig PDA seed.']
            type: 'u8'
          },
          {
            name: 'members'
            docs: ['Members of the multisig.']
            type: {
              vec: {
                defined: 'Member'
              }
            }
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
            name: 'authority'
            type: 'publicKey'
          },
          {
            name: 'bump'
            type: 'u8'
          }
        ]
      }
    }
  ]
  types: [
    {
      name: 'Member'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'key'
            type: 'publicKey'
          },
          {
            name: 'permissions'
            type: {
              defined: 'Permissions'
            }
          }
        ]
      }
    },
    {
      name: 'Permissions'
      docs: ['Bitmask for permissions.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'mask'
            type: 'u8'
          }
        ]
      }
    },
    {
      name: 'Permission'
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'Initiate'
          },
          {
            name: 'Vote'
          },
          {
            name: 'Execute'
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
          name: 'multisig',
          isMut: false,
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
      name: 'projectDelete',
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
    },
    {
      name: 'multisig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'createKey',
            docs: ['Key that is used to seed the multisig PDA.'],
            type: 'publicKey'
          },
          {
            name: 'configAuthority',
            docs: [
              'The authority that can change the multisig config.',
              'This is a very important parameter as this authority can change the members and threshold.',
              '',
              'The convention is to set this to `Pubkey::default()`.',
              'In this case, the multisig becomes autonomous, so every config change goes through',
              'the normal process of voting by the members.',
              '',
              'However, if this parameter is set to any other key, all the config changes for this multisig',
              'will need to be signed by the `config_authority`. We call such a multisig a "controlled multisig".'
            ],
            type: 'publicKey'
          },
          {
            name: 'threshold',
            docs: ['Threshold for signatures.'],
            type: 'u16'
          },
          {
            name: 'timeLock',
            docs: [
              'How many seconds must pass between transaction voting settlement and execution.'
            ],
            type: 'u32'
          },
          {
            name: 'transactionIndex',
            docs: [
              'Last transaction index. 0 means no transactions have been created.'
            ],
            type: 'u64'
          },
          {
            name: 'staleTransactionIndex',
            docs: [
              'Last stale transaction index. All transactions up until this index are stale.',
              'This index is updated when multisig config (members/threshold/time_lock) changes.'
            ],
            type: 'u64'
          },
          {
            name: 'reserved',
            docs: ['Reserved for future use.'],
            type: 'u8'
          },
          {
            name: 'bump',
            docs: ['Bump for the multisig PDA seed.'],
            type: 'u8'
          },
          {
            name: 'members',
            docs: ['Members of the multisig.'],
            type: {
              vec: {
                defined: 'Member'
              }
            }
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
            name: 'authority',
            type: 'publicKey'
          },
          {
            name: 'bump',
            type: 'u8'
          }
        ]
      }
    }
  ],
  types: [
    {
      name: 'Member',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'key',
            type: 'publicKey'
          },
          {
            name: 'permissions',
            type: {
              defined: 'Permissions'
            }
          }
        ]
      }
    },
    {
      name: 'Permissions',
      docs: ['Bitmask for permissions.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'mask',
            type: 'u8'
          }
        ]
      }
    },
    {
      name: 'Permission',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Initiate'
          },
          {
            name: 'Vote'
          },
          {
            name: 'Execute'
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
