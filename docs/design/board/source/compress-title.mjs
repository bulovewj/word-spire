import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {root} from './assets.mjs'
const require=createRequire(`${root}/package.json`),sharp=require('sharp')
const original=`${root}/docs/design/concept/영상-재제작-2판/시작화면-포스터원본.png`
const output=`${root}/src/ui/media/title-korean-v1.png`
await sharp(original).resize({width:1232,kernel:'nearest'}).png({palette:true,quality:100,dither:0,compressionLevel:9,effort:10}).toFile(output)
assert.ok((await fs.stat(output)).size<=400000)
console.log('타이틀 PNG', (await fs.stat(output)).size,'바이트')
