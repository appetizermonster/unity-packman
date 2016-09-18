# unity-packman
A tiny package dependency manager for Unity, powered by Github

## Why package manager for Unity?
I am working with many Unity projects, and most of them use somewhat shared packages.  
but there was no clever way to support package dependencies for programmers yet. so I started this project.  

with `unity-packman`, all package dependencies will be installed in `Assets/Plugins/packman-pkgs` folder.  
you don't need to copy packages manually.

## Requirements
- nodejs (>= 6.0.0) / npm
- git

## Getting Started
In your project directory (parent of Unity `Assets` folder).
```bash
npm install -g unity-packman
```

Below command will create `packman.json` for your project.
```bash
unity-packman init
```
Then, now you can install dependency like this:
```bash
unity-packman install appetizermonster/Unity3D-Co
```

## Extra Commands
- Install All Dependencies in `packman.json`
```bash
unity-packman install
```

- Remove Installed Dependency
```bash
unity-packman remove appetizermonster/Unity3D-Co
```

- Update `.gitignore` for unity-packman
```bash
unity-packman gitignore
```

- Copy modified assets back into repository directory (to commit changes)
```bash
unity-packman copyback appetizermonster/Unity3D-Co
```

## Structure of `packman.json`
```javascript
{
  "name": "Unity3D-Co",                           // Package Name
  "export": "Assets/Co",                          // Export Directory
  "dependencies": [
    "appetizermonster/Unity3D-RecompileDisabler"  // Package URI
  ]
}
```

## Examples of Package URI
- Default
  
  ```
  appetizermonster/Unity3D-Co
  ```

- Specific Commit (with SHA1 Hash)
  
  ```
  appetizermonster/Unity3D-Co?commit=6236ae6ed9e57de626b31e8d1c0957e074cf9331
  ```

- Specific Branch
  
  ```
  appetizermonster/Unity3D-Co?branch=develop
  ```

- Specific Tag

  ```
  appetizermonster/Unity3D-Co?tag=v0.0.1
  ```

## TODO
- `prune` command

## Example Packages
- [appetizermonster/Unity3D-Co](https://github.com/appetizermonster/Unity3D-Co)
- [appetizermonster/Unity3D-RecompileDisabler](https://github.com/appetizermonster/Unity3D-RecompileDisabler)

## Contribution
Any contributions are welcome!, Please open an issue!

## License
MIT
