import * as exec from '@actions/exec'

export interface BufferedExecResult {
  statusCode: number,
  stdout: string,
};

export default async function bufferedExec(cmd: string, args: string[]): Promise<BufferedExecResult> {
  const buffers: Buffer[] = [];
  const statusCode = await exec.exec(cmd, args, {
    listeners: {
      stdout: chunk => buffers.push(chunk),
      stderr: chunk => process.stderr.write(chunk),
    },
    silent: true,
    ignoreReturnCode: true,
  });
  const stdout = Buffer.concat(buffers).toString('utf8');
  return {statusCode, stdout};
}
