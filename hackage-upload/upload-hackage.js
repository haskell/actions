module.exports = async ({ inputs, core, glob, exec }) => {
  const archive = await findArchive(glob, inputs.archive)
  const path = inputs.candidate ? '/packages/candidates' : '/packages'
  await exec.exec('curl', [
    inputs.url + path,
    '-XPOST',
    '-H', `Authorization: X-ApiKey ${inputs.token}`,
    '-F', `package=@${archive}`,
  ])

  core.info(`Successfully uploaded ${archive}!`)
}

const findArchive = async (glob, archiveGlob) => {
  const matches = await glob.create(archiveGlob).then((g) => g.glob())
  if (matches.length === 0) {
    throw new Error(`Found no sdist archives matching: ${archiveGlob}`)
  } else if (matches.length > 1) {
    throw new Error(`Found multiple sdist archives matching "${archiveGlob}": ${JSON.stringify(matches)}`)
  }
  return matches[0]
}
