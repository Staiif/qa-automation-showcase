const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro ne doit pas surveiller les artefacts de build Gradle : ce sont des
 * milliers de fichiers régénérés à chaque build, qui saturent le quota de
 * file watchers (inotify) sous Linux.
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: exclusionList([
      /android\/build\/.*/,
      /android\/app\/build\/.*/,
      /android\/\.gradle\/.*/,
    ]),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
