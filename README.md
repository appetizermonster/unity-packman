# unity-packman
A tiny package dependency manager for Unity, powered by Github

## Getting Started
```bash
npm install -g unity-packman
unity-packman install
```

## Example of packman.json
```javascript
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
