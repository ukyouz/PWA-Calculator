# A Fully Functional JS Calculator

The main purpose for this web app is a demostration of the AWP application.

This is a Javascript calculator without using  `eval()` function, while meantime fully functional for all possible integer operation combinations. Notice that this is an **Interger** calculator, floating point number will be truncated, for example 7/2 will be 3 instead of 3.5.

Due to the javascript `Number.MAX_SAFE_INTEGER` limitation, I decided to support the largest number for now is only at Dword size, though the 64-bit number may be implanted for the next feature.

## References

1. [MDN web docs - Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)

## Resources

1. [LCD Font](https://www.dafont.com/Es/electronic-highway-sign.font)

## Webpack

1. [html-loader](https://webpack.docschina.org/loaders/html-loader/)
2. [Entry Points](https://webpack.js.org/concepts/entry-points/)

### Basic Settings

1. https://skychang.github.io/2015/08/27/Webpack-dev_server/
2. https://ithelp.ithome.com.tw/articles/10194056
3. https://medium.com/html-test/從無到有建立-webpack-設定檔-一-42fbc76a2d37
4. http://www.mrmu.com.tw/2017/08/18/webpack-tutorial2-css-scss/
5. https://blog.johnwu.cc/article/webpack-4-sass-to-css.html
6. https://pjchender.github.io/2018/05/17/webpack-學習筆記（webpack-note）/
7. https://medium.com/@cos214159/webpack-筆記整理-三-loader-8ce3cc04e9e4

### CSS File Extractor
1. https://5xruby.tw/posts/webpack-06/
2. https://medium.com/@toumasaya/webpack-2-實作筆記-3-style-css-and-sass-loaders-9e3b38615e9c
3. https://www.kancloud.cn/hfpp2012/webpack-tutorial/467002

### Issues

1. [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/760)
