const async = require('async')
const fs = require('fs');
const path = require('path');

const { execSync } = require('child_process');
const { createWorker } = require('tesseract.js');
const Tesseract = require('tesseract.js');
const worker = createWorker();
const Clipper = require('image-clipper');
const Canvas = require('canvas');
Clipper.configure('canvas', Canvas);
const pdf2img = require('pdf2img');

const semuapeta = fs.readdirSync(`./pdf/mentah`)
var task = []
var idsls_all = {}

semuapeta.forEach(filename => {
    var name = filename
    task.push((cb_t) => {
        renamePeta(name, cb_t)
    })
})
async.series(task, (e, f) => {
    console.log(e, f)
    console.log('====== FINISH ======')
    // let shutdown = execSync(`shutdown /s`);
})

function renamePeta(nama, cb_rename) {
    var filename = nama.replace(/\.PDF/, '')
    async.auto({
        rotateLeft: (cb_r) => {
            // let output = execSync(`pdftk pdf/mentah/${filename}.PDF cat 1left output pdf/ready/${filename}.pdf`);
            let output = execSync(`pdftk pdf/mentah/${filename}.PDF cat 1right output pdf/ready/${filename}.pdf`);
            console.log(filename + ' 1. rotateLeft done')
            cb_r(null, '1. rotateLeft done')
        },
        pdf2Image: ['rotateLeft', (pr, cb_p) => {
            var pdf2imgins = new pdf2img({
                type: "jpg",
                size: 2048,
                density: 600,
                outputdir: __dirname + path.sep + 'img',
                // outputname: name,
                page: null,                                 // convert selected page, default null (if null given, then it will convert all pages)
                quality: 90
            });
            pdf2imgins.convert(`./pdf/ready/${filename}.pdf`, function (err, info) {
                if (err) console.log(err)
                console.log(filename + ' 2. pdf2Image done')
                cb_p(null, '2. pdf2Image done')
            });
        }],
        cropImage: ['pdf2Image', (pr, cb_c) => {
            Clipper(`./img/${filename}_1.jpg`, function () {
                this.crop(1600, 0, 400, 90)
                    .resize(400, 90)
                    .quality(100)
                    .toFile(`./img/${filename}_ok.jpg`, function () {
                        console.log(filename + ' 3. cropImage done')
                        cb_c(null, '3. cropImage done')
                    });
            });
        }],
        getIDAndRename: ['cropImage', (pr, cb_g) => {
            Tesseract.recognize(
                `./img/${filename}_ok.jpg`,
                'eng'
                // { logger: m => console.log(m) }
            ).then(({ data: { text } }) => {
                var name = text.match(/\d{14}/)
                if (name) {
                    if (!idsls_all[name[0]]) {
                        idsls_all[name[0]] = 1
                        // fs.renameSync(`./pdf/mentah/${filename}.PDF`, `./pdf/final/${name[0]}_${filename}.pdf`);
                        fs.renameSync(`./pdf/mentah/${filename}.PDF`, `./pdf/finish/${name[0]}_${filename}.pdf`);
                        fs.renameSync(`./img/${filename}_1.jpg`, `./img/final/${name[0]}.jpg`);
                    } else {
                        idsls_all[name[0]] = idsls_all[name[0]] + 1
                        if (idsls_all[name[0]] === 2) {
                            fs.renameSync(`./img/final/${name[0]}.jpg`, `./img/final/${name[0]}_01.jpg`);
                        }
                        fs.renameSync(`./pdf/mentah/${filename}.PDF`, `./pdf/finish/${name[0]}_0${idsls_all[name[0]]}_${filename}.pdf`);
                        fs.renameSync(`./img/${filename}_1.jpg`, `./img/final/${name[0]}_0${idsls_all[name[0]]}.jpg`);
                    }
                    fs.unlinkSync(`./pdf/ready/${filename}.pdf`)
                    // fs.unlinkSync(`./img/${filename}_1.jpg`)
                    fs.unlinkSync(`./img/${filename}_ok.jpg`)
                    console.log(filename + ' 4. getIDAndRename done')
                    cb_g(null, '4. getIDAndRename done')
                } else {
                    console.log(filename + ' 4. getIDAndRename failed')
                    fs.unlinkSync(`./img/${filename}_ok.jpg`)
                    retryCropAndGetID(filename, 1, cb_g)
                    // cb_g(null, filename + ' failed getIDAndRename.')
                }
            })
        }]
    }, (e, f) => {
        console.log(filename + ' finish.')
        cb_rename && cb_rename(null, 'ok')
    })
}

function retryCropAndGetID(filename, retry, cb_g) {
    async.auto({
        cropImage: (cb) => {
            if (retry === 1)
                cropImage(filename, 1600, 0, 400, 95, retry, cb)
            else if (retry === 2)
                cropImage(filename, 1600, 0, 400, 100, retry, cb)
            else if (retry === 3)
                cropImage(filename, 1600, 0, 400, 105, retry, cb)
            else if (retry === 4)
                cropImage(filename, 1600, 0, 400, 85, retry, cb)
            else if (retry === 5)
                cropImage(filename, 1600, 0, 400, 80, retry, cb)
            else if (retry === 6)
                cropImage(filename, 1610, 0, 400, 90, retry, cb)
            else if (retry === 7)
                cropImage(filename, 1620, 0, 400, 90, retry, cb)
            else if (retry === 8)
                cropImage(filename, 1630, 0, 400, 90, retry, cb)
            else if (retry === 9)
                cropImage(filename, 1640, 0, 400, 90, retry, cb)
            else if (retry === 10)
                cropImage(filename, 1650, 0, 400, 90, retry, cb)
            else if (retry === 11)
                cropImage(filename, 1660, 0, 400, 90, retry, cb)
            else if (retry === 12)
                cropImage(filename, 1670, 0, 400, 90, retry, cb)
            else if (retry === 13)
                cropImage(filename, 1680, 0, 400, 90, retry, cb)

        },
        getIDAndRename: ['cropImage', (pr, cb) => {
            getIDAndRename(filename, pr.cropImage, retry, cb)
        }]
    }, (e, f) => {
        if (e) {
            if (retry === 13) {
                fs.unlinkSync(`./img/${filename}_ok_13.jpg`)
                fs.unlinkSync(`./pdf/ready/${filename}.pdf`)
                cb_g(null, '4. getIDAndRename done')
            }
            else {
                fs.unlinkSync(`./img/${filename}_ok_${retry}.jpg`)
                retryCropAndGetID(filename, retry + 1, cb_g)
            }
        }
        else
            cb_g(null, '4. getIDAndRename done')
    })
}

function getIDAndRename(filename, input_path, retry, cb) {
    Tesseract.recognize(
        input_path,
        'eng'
    ).then(({ data: { text } }) => {
        var name = text.match(/\d{14}/)
        if (name) {
            if (!idsls_all[name[0]]) {
                idsls_all[name[0]] = 1
                // fs.renameSync(`./pdf/mentah/${filename}.PDF`, `./pdf/final/${name[0]}_${filename}.pdf`);
                fs.renameSync(`./pdf/mentah/${filename}.PDF`, `./pdf/finish/${name[0]}_${filename}.pdf`);
                fs.renameSync(`./img/${filename}_1.jpg`, `./img/final/${name[0]}.jpg`);
            } else {
                idsls_all[name[0]] = idsls_all[name[0]] + 1
                if (idsls_all[name[0]] === 2) {
                    fs.renameSync(`./img/final/${name[0]}.jpg`, `./img/final/${name[0]}_01.jpg`);
                }
                fs.renameSync(`./pdf/mentah/${filename}.PDF`, `./pdf/finish/${name[0]}_0${idsls_all[name[0]]}_${filename}.pdf`);
                fs.renameSync(`./img/${filename}_1.jpg`, `./img/final/${name[0]}_0${idsls_all[name[0]]}.jpg`);
            }
            fs.unlinkSync(`./pdf/ready/${filename}.pdf`)
            // fs.unlinkSync(`./img/${filename}_1.jpg`)
            // fs.unlinkSync(`./img/${filename}_ok.jpg`)
            // fs.renameSync(`./pdf/mentah/${filename}.PDF`, `./pdf/finish/${name[0]}_${filename}.pdf`);
            // fs.unlinkSync(`./pdf/ready/${filename}.pdf`)
            // fs.unlinkSync(`./img/${filename}_1.jpg`)
            fs.unlinkSync(input_path)
            console.log(filename + ' 4. getIDAndRename done')
            cb(null, true)
        } else {
            console.log(filename + ' 4. getIDAndRename failed')
            cb('Failed', null)
        }
    })
}

function cropImage(filename, x, y, width, height, retry, cb) {
    Clipper(`./img/${filename}_1.jpg`, function () {
        this.crop(x, y, width, height)
            .resize(400, 90)
            .quality(100)
            .toFile(`./img/${filename}_ok_${retry}.jpg`, function () {
                console.log(filename + ' try cropImage ' + retry)
                cb(null, `./img/${filename}_ok_${retry}.jpg`)
            });
    });
}