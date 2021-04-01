const xlsx = require("node-xlsx").default;
const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');


const file_path = __dirname + "/Hasil Olah DP1.xlsx";
const data = xlsx.parse(file_path);
var xlsx_row = {}
var files_id_count = {}
//cek index
data[0].data.forEach((d, i) => {
    if (i > 2) xlsx_row[d[3]] = i+1
})
// console.log(xlsx_row)
//baca list file
const semuapeta = fs.readdirSync(`./pdf/final`)
XlsxPopulate.fromFileAsync(file_path)
    .then(workbook => {
        let sheet = workbook.sheet(0);
        semuapeta.forEach(filename => {
            let id = filename.match(/\d{14}/)[0]
            if (!files_id_count[id])
                files_id_count[id] = 1
            else
                files_id_count[id]++
            // console.log(files_id_count[id], id)
            if (xlsx_row[id + '00'] && files_id_count[id]) {
                sheet.cell("E" + (xlsx_row[id + '00'])).value(files_id_count[id])
            } else {
                if (xlsx_row[id + '0001'] && files_id_count[id]) {
                    sheet.cell("E" + xlsx_row[id + '0001']).value(files_id_count[id])
                } else
                    console.log(id + '00 not found', (xlsx_row[id + '00']))
            }
        })
        if (fs.existsSync(__dirname + `/Result.xlsx`)) {
            fs.unlinkSync(__dirname + `/Result.xlsx`);
        }
        workbook.toFileAsync(__dirname + `/Result.xlsx`);
    }).then(dataa => {
        console.log('Finished');
    })

