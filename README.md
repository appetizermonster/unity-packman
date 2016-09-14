# unity-packman
A tiny package dependency manager for Unity 5, powered by Github

## Getting Started
```bash
npm install -g unity-packman
unity-packman install
```

## Example of packman.json
```json
{
  "name": "Package Name",
  "export": "Assets/SomeFolder",                 // Path to export
  "dependencies": [
    "appetizermonster/Unity3D-RecompileDisabler" // Github Uri
  ]
}
```

## License
MIT
