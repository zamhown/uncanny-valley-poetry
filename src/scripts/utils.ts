import fs from 'fs'
import path from 'path'

export function readFile(path: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (!err) {
        resolve(data);
      } else {
        reject(err);
      }
    })
  })
}

export function writeFile(path: string, data: any) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, data, 'utf-8', err => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    })
  })
}

export function readDir(entry: string): string[] {
  let txtList: string[] = []
  const dirInfo = fs.readdirSync(entry);
  dirInfo.forEach(item => {
    const location = path.join(entry, item);
    const info = fs.statSync(location);
    if (info.isDirectory()) {
      txtList = txtList.concat(readDir(location));
    } else {
      txtList.push(location)
    }
  })
  return txtList
}