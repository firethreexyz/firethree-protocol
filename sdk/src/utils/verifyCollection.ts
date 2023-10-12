const verifyCollection = <T>(structure: T, data: T) => {
  let isValid = true

  Object.keys(structure).forEach((key) => {
    if (!data.hasOwnProperty(key)) {
      isValid = false

      throw new Error(
        `Data does not match the structure of the collection. Missing key: ${key}`
      )
    }

    if (typeof structure[key] !== typeof data[key]) {
      isValid = false

      throw new Error(
        `Data does not match the structure of the collection. Key: ${key} should be of type ${typeof structure[
          key
        ]}`
      )
    }
  })

  return isValid
}

export default verifyCollection
