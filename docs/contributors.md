# Contributors

### Checkin

- Do checkin source (src)
- Do checkin build output (dist)

### Dependencies

In order to make sure that the ts files are always transpiled correctly, we run [Husky](https://github.com/typicode/husky) before each commit.
This step ensures that formatting rules are followed and that the typescript code has been transpiled correctly. To make sure Husky runs correctly, please use the following workflow:

```sh
npm install                                 # installs all dependencies including Husky
git add abc.ext                             # Add the files you've changed. This should include files in src and dist (see above)
git commit -m "Informative commit message"  # Commit. This will run Husky
```

During the commit step, Husky will take care of formatting all files with [Prettier](https://github.com/prettier/prettier). It will also bundle the code into a single `dist/index.js` file.
Finally, it will make sure these changes are appropriately included in your commit--no further work is needed.
