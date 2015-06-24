psbatsaver
==========

A photoshop script to generate layer to image follow a save options config file

根据配置文件一键生成指定 psb 文件特定图为图片，并放在指定文件夹的 photoshop script。

## 使用方法

在 psd 所在目录建立文件 `psbatsaver.json`，详见示例文件 `psbatsaver.json` 规则如下：

1. autoClose: 是否自定关闭
2. rules：存储个文件对应的生成规则, 为数组，其中的内容如下：
    * target：规则对应文件的 psd 文件名，包含后缀
    * mask：特殊图层名，为数组
    * exportSetting：导出配置，为一数组，即一个文件，可以对应多种保存规则
        * directSave：是否直接保存
        * savePath：保存路径，使用相对路径
        * size：保存的尺寸
        * name：保存的文件名
