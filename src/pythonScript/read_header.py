import sys
import openpyxl
import json
import xlrd

excel_path = sys.argv[1]
if excel_path.endswith(".xls"):
    workbook = xlrd.open_workbook(excel_path)
    worksheet = workbook.sheet_by_index(0)
    header = worksheet.row_values(0)
else:
    workbook = openpyxl.load_workbook(excel_path)
    worksheet = workbook.active
    header = []
    for cell in worksheet[1]:
        header.append(cell.value)


# 输出表头
print(json.dumps(header,ensure_ascii=False))
