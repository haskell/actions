export default () => {
  process.stdin.setEncoding('utf8');
  let input = '';
  process.stdin.on('data', chunk => {
    input += chunk;
  });

  process.stdin.resume();

  return new Promise((resolve, reject) => {
    process.stdin.on('end', () => resolve(input));
    process.stdin.on('error', reject);
  });
};
