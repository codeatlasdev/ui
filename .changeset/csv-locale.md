---
"@codeatlasdev/ui": minor
---

`toCsv(rows, columns, options)` takes `{ locale?, delimiter?, bom? }`. With a `locale` whose decimal mark is a comma (`pt-BR`), numbers are written with that mark (`12,5`) and fields are separated by `;`, which is what Excel in Brazil expects; `delimiter` overrides the separator and `bom` prepends a UTF-8 byte order mark. A field holding the separator, a quote or a line break is quoted. `ExportMenu` passes its new `csv` prop through (`csv={{ locale: 'pt-BR' }}`); its download still starts with a BOM. New type `CsvOptions`. Output without options is unchanged.
