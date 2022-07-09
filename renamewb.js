const async = require('async')
const fs = require('fs');
const path = require('path');

const Jimp = require('jimp');
const Tesseract = require('tesseract.js');
const Clipper = require('image-clipper');
const Canvas = require('canvas');
Clipper.configure('canvas', Canvas);
const input_folder = `./input/mentah/scanned`
if (!fs.existsSync(`./input`)) {
    fs.mkdirSync(`./input`);
}
if (!fs.existsSync(`./input/mentah`)) {
    fs.mkdirSync(`./input/mentah`);
}
if (!fs.existsSync(`./input/mentah/scanned`)) {
    fs.mkdirSync(`./input/mentah/scanned`);
}
const input_ready_folder = `./input/mentah/ready`
if (!fs.existsSync(`./input/mentah/ready`)) {
    fs.mkdirSync(`./input/mentah/ready`);
}
const output_folder = `./output`
if (!fs.existsSync(`./output`)) {
    fs.mkdirSync(`./output`);
}

const semuapeta = fs.readdirSync(input_folder)
var task = []
var idsls_all = {}

const xlsx = require("node-xlsx").default;
const master = './Kontrol Scan WB.xlsx'
const data = xlsx.parse(master);
kolaka = {}
let imgReaded;

data[0].data.forEach((row, i) => {
    if (i > 0) {
        const kec = row[0]
        const desa = row[1]
        if (!kolaka[kec]) kolaka[kec] = {
            name: row[2]
        }
        if (kolaka[kec]) {
            if (!kolaka[kec][desa]) kolaka[kec][desa] = {
                name: row[3]
            }
        }
    }
})

semuapeta.forEach(filename => {
    var name = filename
    task.push((cb_t) => {
        try {
            renamePeta(name, 90, cb_t)
        } catch (error) {
            cb_t(null, 'failed')
        }
    })
})
async.series(task, (e, f) => {
    console.log(e, f)
    console.log('====== FINISH ======')
})

async function rotateImg(path, degree, cb) {
    imgReaded = Jimp.read(path, (err, img) => {
        if (err) throw err
        img.rotate(degree).write(path, () => {
            console.log('1. Rotate done')
            cb()
        });
    });
}

function renamePeta(nama, degree, cb_rename) {
    var filename = nama.replace(/\.JPG/, '')
    if (fs.existsSync(`${input_folder}/${filename}.JPG`)) {
        fs.copyFileSync(`${input_folder}/${filename}.JPG`, `${input_ready_folder}/${filename}.jpg`);
    }
    const input_ready_file = `${input_ready_folder}/${filename}.jpg`;
    async.auto({
        cropImage: (cb_c) => {
            console.log('==================');
            console.log('==> ', filename);
            rotateImg(input_ready_file, degree, () => {
                Clipper(input_ready_file, function () {
                    if (!fs.existsSync(`${output_folder}/cropped`)) {
                        fs.mkdirSync(`${output_folder}/cropped`);
                    }
                    this.crop(2550, 0, 780, 200)
                        // .resize(400, 90)
                        .quality(100)
                        .toFile(`${output_folder}/cropped/${filename}_ok.jpg`, function () {
                            console.log('2. cropImage done')
                            cb_c(null, '3. cropImage done')
                        });
                });
            })
        },
        getIDAndRename: ['cropImage', (pr, cb_g) => {
            Tesseract.recognize(
                `${output_folder}/cropped/${filename}_ok.jpg`,
                'eng'
            ).then(({
                data: {
                    text
                }
            }) => {
                var idbs = text.match(/\d{13}B/)
                if (idbs) {
                    const kec = idbs[0].substring(4, 7)
                    const desa = idbs[0].substring(7, 10)
                    if (!kolaka[kec]) {
                        console.log('3. getIDAndRename failed. Kec not know')
                        console.log('Detected text: ', filename, idbs[0], text)
                        cb_g(null, '3. getIDAndRename failed')
                        return
                    }
                    if (!kolaka[kec][desa]) {
                        console.log('3. getIDAndRename failed. Desa not know')
                        console.log('Detected text: ', filename, idbs[0], text)
                        cb_g(null, '3. getIDAndRename failed')
                        return
                    }
                    if (!fs.existsSync(`./output/finish`)) {
                        fs.mkdirSync(`./output/finish`);
                    }
                    const kecdir = `./output/finish/${kec} ${kolaka[kec].name}`;
                    const desadir = `./output/finish/${kec} ${kolaka[kec].name}/${desa} ${kolaka[kec][desa].name}`;
                    if (!fs.existsSync(kecdir)) {
                        fs.mkdirSync(kecdir);
                    }
                    if (!fs.existsSync(desadir)) {
                        fs.mkdirSync(desadir);
                    }
                    if (!idsls_all[idbs[0]]) {
                        idsls_all[idbs[0]] = 1
                        fs.renameSync(input_ready_file, `${desadir}/${idbs[0]}.jpg`);
                    } else {
                        idsls_all[idbs[0]] = idsls_all[idbs[0]] + 1
                        if (idsls_all[idbs[0]] === 2) {
                            fs.renameSync(`${desadir}/${idbs[0]}.jpg`, `${desadir}/${idbs[0]}_1.jpg`);
                        }
                        fs.renameSync(input_ready_file, `${desadir}/${idbs[0]}_${idsls_all[idbs[0]]}.jpg`);
                    }
                    console.log('3. getIDAndRename done')
                    cb_g(null, '3. getIDAndRename done')
                } else {
                    console.log('3. getIDAndRename failed.')
                    console.log('Detected text: ', filename, text)
                    console.log('Retry....')
                    if (degree === 90) renamePeta(nama, -90, cb_g)
                    else {
                        console.log('3. getIDAndRename failed.')
                        console.log('Detected text: ', filename, text)
                        cb_g(null, '3. getIDAndRename failed')
                    }

                }
            })
        }]
    }, (e, f) => {
        console.log(filename + ' finish.')
        cb_rename && cb_rename(null, 'ok')
    })
}