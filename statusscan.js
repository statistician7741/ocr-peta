const fs = require('fs');
const XlsxPopulate = require('xlsx-populate');
//read scanned files, count frequency
const allScannedIdBsCount = {};
const allScannedKecFolder = fs.readdirSync('./output/finish big size')
allScannedKecFolder.forEach(kecFolderName => {
  const allScannedDesaFolderName = fs.readdirSync(`./output/finish big size/${kecFolderName}`)
  allScannedDesaFolderName.forEach(scannedDesaFolderName => {
    const allScannedBSName = fs.readdirSync(`./output/finish big size/${kecFolderName}/${scannedDesaFolderName}`)
    allScannedBSName.forEach(bsFileName => {
      const idBs = bsFileName.replace(/_?\d?\d?\.jpg/, '')
      if (!allScannedIdBsCount[idBs]) allScannedIdBsCount[idBs] = 1;
      else allScannedIdBsCount[idBs] ++;
    })
  })
})
//loop through rows of excel
const xlsx = require("node-xlsx").default;
const masterPath = './Kontrol Scan WB.xlsx'
const masterBSExcel = xlsx.parse(masterPath);
XlsxPopulate.fromFileAsync(masterPath)
  .then(workbook => {
    let sheet = workbook.sheet(0);
    masterBSExcel[0].data.forEach((row, i) => {
      if (i > 0) {
        let idBS = row[5]
        // console.log(files_id_count[id], id)
        if (allScannedIdBsCount[idBS]) {
          sheet.cell("G" + (i+1)).value(allScannedIdBsCount[idBS])
        } 
      }
    })
    if (fs.existsSync(__dirname + `/Status Scan.xlsx`)) {
      fs.unlinkSync(__dirname + `/Status Scan.xlsx`);
    }
    workbook.toFileAsync(__dirname + `/Status Scan 2.xlsx`);
  }).then(dataa => {
    console.log('Finished');
  })
//done