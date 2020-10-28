# How to use.

1. Build this repo
    1. clone https://github.com/dannyvv/profile-merger
    1. `yarn install`
    1. `yarn build`

1. Build private version of just
    1. Clone https://github.com/dannyvv/just
    1. Switch to branch pr/AddProfiler
    1. `yarn install`
    1. `yarn build`
    1. `cd packages\just-task`
    1. `yarn link`

1. Go to a repro you want to test i.e. react-native-windows
    1. Clone https://github.com/microsoft/react-native-windows
    1. Update package.json
        1. Add profile flags: `--profile --profile-location d:\\temp\\prof` to lerna and to the running just-task scripts i.e.:
           ```diff
           -"build": "lerna run build --stream -- --color",
           +"build": "lerna run build --stream --profile --profile-location d:\\temp\\prof -- --color --profile --profile-location d:\\temp\\prof",
           ```
        1. Create the directory: `mkdir d:\temp\prof`.
    1. `yarn install`
    1. `yarn build`

1. Merge the profiles
    1. cd  to repo where you cloned profile-merger
    1. `node bin/profile-merger.js --folder d:\temp\prof`

1. Open `merged.json` in latest edge or chrome
    1. Launch Edge
    1. F12
    1. Go to the 'Profile' tab
    1. Click 'Load Profile' button in the toolbar of the 'Profile' tab
    1. Open `d:\temp\prof\merge.json`
