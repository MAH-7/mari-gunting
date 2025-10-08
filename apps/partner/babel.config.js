module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Temporarily disabled - causing async plugin error
      // 'nativewind/babel',
    ],
  };
};
