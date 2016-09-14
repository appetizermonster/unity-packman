# unity-packman
A tiny package dependency manager for Unity, powered by Github

## Requirements
- nodejs / npm
- git

## Usage
- Basic Usage
```bash
npm install -g unity-packman
unity-packman init
unity-packman install appetizermonster/Unity3D-Co
```

- Install All Dependencies
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

## Structure of `packman.json`
```javascript
{
  "name": "Unity3D-Co",                           // Package Name
  "export": "Assets/Co",                          // Export Directory
  "dependencies": [
    "appetizermonster/Unity3D-RecompileDisabler"  // Github Short URI
  ]
}
```

## License
MIT
