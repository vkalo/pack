# pack-opener

## 简介
modJS是一套轻量级前端模块加载解决方案，用于加载js,json,css或图片和文本文件，js依赖采用CMD模式。

## 安装
`npm install pack-code`

## 使用

**模块的定义**

**pack** (id, depnds , factory)

  在平常开发中，我们只需写factory中的代码即可，无需手动定义模块。
  id默认是代码的路径,depends为该模块代码的依赖,发布工具会自动将模块代码的id和depends嵌入factory的闭包里，但问题是发布工具暂时还没有准备完善！。

**opener** (id,callback)

 和NodeJS里获取模块的方式类似，非常简单，首次加载时请通过callback回调获取依赖，第二次之后可以直接opener开箱使用，一次开箱后所以子依赖都会加载。

## 其他
本项目的优点是无需resourceMap等依赖文件，所有代码依赖关系由都包含在代码自身。