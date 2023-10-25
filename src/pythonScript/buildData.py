#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""
@Project ：example 
@File    buildData.py
@Author  ：DMJ
@Date    ：2023/6/8 11:59 
@Desc    :表格追加字段
"""
import pandas
import os
import warnings
import json
import sys
import time


class ExcelRead:
    def __init__(self, file_path, sheet_name=0, **kwargs):
        """
            读取Excel
        :param file_path:  文件路径
        :param sheet_name: 表名
        :param kwargs: 
        """
        self.path = file_path
        self.sheet_name = sheet_name

    @property
    def values(self) -> list:
        # 读取Excel文件
        if not os.path.exists(self.path):
            raise FileNotFoundError(f"找不到文件:{self.path}")
        excel_name = self.path.rsplit(
            '/', 1)[1] if "/" in self.path else self.path
        with warnings.catch_warnings(record=True):
            warnings.simplefilter('ignore', ResourceWarning)
            df = pandas.read_excel(
                self.path, sheet_name=self.sheet_name, dtype='str')
        # 替换Excel表格内的空单元格，否则在下一步处理中将会报错
        df.fillna("", inplace=True)
        df_list = []
        for row in df.index.values:
            # loc为按列名索引 iloc为按位置索引，使用的是 [[行号], [列名]]
            df_line = df.loc[row, df.columns.values.tolist()].to_dict()
            # print(df.loc[row, df.columns.values.tolist()])
            for k, v in df_line.items():
                if v == 'true' or v == "True":
                    df_line[k] = True
                elif v == 'false' or v == "False":
                    df_line[k] = False
                # if not isinstance(v, str):
                #     df_line[k] = str(v)
            df_list.append(df_line)
        return df_list

    @property
    def values_str(self) -> list:
        json_str = []
        for value_json in self.values:
            json_str.append({key: value.__str__()
                             for key, value in value_json.items()})
        return json_str


def to_excel(items, tag):
    pad = pandas.DataFrame(items)
    export_path = config_data['master'].rsplit(".", 1)[0]
    ts = str(int(time.time()))[-3:]
    file_name = export_path + '-' + tag + '-' + ts + '.xlsx'
    with pandas.ExcelWriter(file_name, engine='xlsxwriter',
                            engine_kwargs={'options': {"strings_to_urls": False}}) as writer:
        pad.to_excel(writer, index=False)
    print(file_name)


def field_add():
    only_key = config_data['only_key']
    slave_match_key = config_data['slave_key']
    repeat_operation = config_data['duplicate_fields_operation']
    repeat_content_operation = config_data['duplicate_content_operation']
    merge_separator = config_data['merge_separator']
    items = []
    slave_items = {}
    """
    {
        "副表名":{"副表匹配键值":{"字段1":"数据1","字段2":"数据2"}}
    }
    """
    master_excel = ExcelRead(config_data['master']).values
    for slave in config_data['slave']:
        # 打开追加表
        slave_excel = ExcelRead(slave).values
        for row in slave_excel:
            # 过滤没有指定id的数据
            if slave_match_key[slave] not in row:
                continue
            if slave not in slave_items:
                slave_items[slave] = {}
            # 将数据存入字典
            if repeat_content_operation == 1:
                slave_items[slave][row[slave_match_key[slave]]] = {}
                for slave_key in config_data['slave_add_key'][slave]:
                    if slave_key not in slave_items[slave][row[slave_match_key[slave]]]:
                        if config_data['strip_space']:
                            slave_items[slave][row[slave_match_key[slave]]][slave_key] = row.get(slave_key).strip()
                        else:
                            slave_items[slave][row[slave_match_key[slave]]][slave_key] = row.get(slave_key)
            elif repeat_content_operation == 2:
                if config_data['strip_space']:
                    slave_items[slave][row[slave_match_key[slave]]] = {slave_key: row.get(
                        slave_key).strip() for slave_key in config_data['slave_add_key'][slave]}
                else:
                    slave_items[slave][row[slave_match_key[slave]]] = {slave_key: row.get(
                        slave_key) for slave_key in config_data['slave_add_key'][slave]}
            else:
                if row[slave_match_key[slave]] not in slave_items[slave]:
                    slave_items[slave][row[slave_match_key[slave]]] = {}
                for slave_key in config_data['slave_add_key'][slave]:
                    if slave_key not in slave_items[slave][row[slave_match_key[slave]]]:
                        slave_items[slave][row[slave_match_key[slave]]][slave_key] = []
                    slave_val = row.get(slave_key)
                    if config_data['strip_space']:
                        slave_val = row.get(slave_key).strip()
                    slave_items[slave][row[slave_match_key[slave]]][slave_key].append(slave_val)
    for master_row in master_excel:
        # 去除不导出的字段
        item = {key: master_row.get(key)
                for key in config_data['export_key'] if key}
        # 确保匹配键存在
        item[only_key] = master_row[only_key]
        if config_data['strip_space']:
            master_row[only_key] = master_row[only_key].strip()
        # 循环每个子表内容
        repeat_increment = {}

        for slave_row in slave_items.values():
            # 获取子表中与主表匹配键相同的数据
            match_data = slave_row.get(master_row[only_key])
            # 数据为：{"字段1":"数据1","字段2":"数据2"}
            if match_data:
                for key, val in match_data.items():
                    # 填充数据时，源表有值即忽略操作
                    if repeat_operation == 1:
                        if item.get(key) not in [None, "", " "]:
                            continue
                    # 新增时，源表相同字段则新增一个索引
                    elif repeat_operation == 3:
                        if key in item:
                            if key not in repeat_increment:
                                repeat_increment[key] = 1
                            repeat_increment[key] += 1
                            key += f"-{repeat_increment[key]}"
                    item[key] = val if repeat_content_operation != 3 else merge_separator.join(val)
        items.append(item)
    to_excel(items, "追加")


def joint_deduplication():
    config_data['export_key'].extend(config_data['only_keys'])
    export_key = list(set(config_data['export_key']))
    master_excel = ExcelRead(config_data['master']).values
    items = []
    items_ = {}
    cache = set()
    for master_row in master_excel:
        only_key = "###".join([master_row.get(k, "")
                               for k in config_data['only_keys']])
        if config_data['hold'] == "First":
            item = {key: master_row.get(key) for key in export_key if key}
            if only_key in cache:
                continue
            cache.add(only_key)
            items.append(item)
        else:
            items_[only_key] = {key: master_row.get(
                key) for key in export_key if key}
    if config_data['hold'] != "First":
        items = list(items_.values())
    to_excel(items, "去重")


def merge_tables():
    items = []
    config_data['master'] = config_data['tables'][0]
    for table in config_data['tables']:
        excel = ExcelRead(table).values
        table_key = config_data['export_key'][table]
        for row in excel:
            items.append({key: row.get(key) for key in table_key if key})
    to_excel(items, "合并")


config_data = json.loads(sys.argv[1])
# config_data = {
#     "master": '/Users/starsxu/Develop/第三方平台备案.xlsx',
#     "command": 'FieldAdd',
#     "only_key": '行政相对人名称',
#     "export_key": [
#         '证件编号',
#         '行政相对人名称',
#         '注册地址',
#         '数据核对码',
#         '审批通过时间',
#         '第三方平台名称',
#         '善政主体库平台名称',
#         '善政主体库平台链接'
#     ],
#     "slave": ['/Users/starsxu/Develop/第三方平台备案-主体匹配-202310161048.xlsx'],
#     "slave_key": {'/Users/starsxu/Develop/第三方平台备案-主体匹配-202310161048.xlsx': '公司名'},
#     "slave_add_key": {
#         '/Users/starsxu/Develop/第三方平台备案-主体匹配-202310161048.xlsx': ['平台', '链接']
#     },
#     "duplicate_fields_operation": 1,
#     "duplicate_content_operation": 3,
#     "merge_separator": ',',
#     "strip_space": True
# }

if config_data['command'] == "FieldAdd":
    field_add()
elif config_data['command'] == "JointDeduplication":
    joint_deduplication()
elif config_data['command'] == "MergeTables":
    merge_tables()
