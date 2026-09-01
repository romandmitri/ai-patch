# Publish

Reminder on how to publish to `npm` registry.

```shell
git tag vXXX
git push --tags
```

```shell
npm whoami
npm login
```

```shell
npm pack --dry-run
npm publish --access public
```
