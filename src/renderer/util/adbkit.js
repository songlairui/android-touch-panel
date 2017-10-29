import * as util from 'util'
import * as path from 'path'
import * as adb from 'adbkit'
import split from 'split'
const KeyMap = require('./android_key.json')
const client = adb.createClient()

let tracedDevices = null
const status = {
  tryingStart: false,
  tryingStartTouch: false
}
export function tagDevice(device) {
  tracedDevices = device
}
export async function listDevices() {
  console.log('[adbkit] listDevices')
  return await client.listDevices().then(async devices => {
    if (devices.length) {
      await Promise.all(
        devices.map(async device => {
          let properities = await client.getProperties(device.id)
          device.abi = getAbi(properities)
          device.sdk = +properities['ro.build.version.sdk']
          device.name = properities['ro.product.name']
        })
      )
      return devices
    } else {
      return null
    }
  })
}

export async function startMinicap({ orientation }) {
  orientation = orientation || '0'
  if (['0', '90', '180', '270'].indexOf(orientation) === -1) orientation = '0'
  let device = (tracedDevices || (await listDevices()))[0]
  if (!device) {
    return
  }
  console.info('orientation in [startMiniCap]', orientation)
  await killProcsByComm(client, device.id, '', '/data/local/tmp/minicap', '')
  let command = util.format(
    'LD_LIBRARY_PATH=%s exec %s %s',
    path.dirname('/data/local/tmp/minicap.so'),
    '/data/local/tmp/minicap',
    `-P 540x960@360x640/${orientation} -S -Q 50`
  )

  let result = await client.shell(device.id, command).then(out => {
    return new Promise((resolve, reject) => {
      let datachunk = ''
      out.on('error', error => {
        reject({ error, command: command })
      })
      setTimeout(() => {
        resolve({ message: 'there is no error in 100ms', code: 0 })
        status.tryingStart = false
      }, 100)
    })
  })
  return result
}

export async function startMiniTouch() {
  let device = (tracedDevices || (await listDevices()))[0]
  if (!device) {
    return
  }
  await killProcsByComm(client, device.id, '', '/data/local/tmp/minitouch', '')
  let command = 'exec /data/local/tmp/minitouch'
  console.info('StartTouch')
  let result = await client.shell(device.id, command).then(out => {
    return new Promise((resolve, reject) => {
      let datachunk = ''
      out.on('error', error => {
        reject({ error, command: command })
      })
      setTimeout(() => {
        resolve({ message: 'there is no error in 100ms', code: 0 })
        status.tryingStart = false
      }, 100)
    })
  })
  return result
}

// ----------- Process --------- //

export async function checkRunning() {
  let err, result
  let device = (tracedDevices || (await listDevices()))[0]
  if (!device) return { err: new Error('no device'), result }
  result = await listPidsByComm(
    client,
    device.id,
    '',
    '/data/local/tmp/minicap'
  )
  return { err, result }
}

export function listPidsByComm(adb, serial, comm, bin) {
  var users = {
    shell: true
  }
  return adb.shell(serial, ['ps']).then(function(out) {
    return new Promise(function(resolve) {
      var header = true
      var pids = []
      out
        .pipe(split())
        .on('data', function(chunk) {
          if (header) {
            header = false
          } else {
            var cols = chunk.toString().split(/\s+/)
            // console.info('[cols]', cols)
            if (cols.pop() === bin && users[cols[0]]) {
              pids.push(Number(cols[1]))
              console.info(`\n with '${bin}'\t\t\tpushed \n`)
            }
          }
        })
        .on('end', function() {
          resolve(pids)
        })
    })
  })
}

function waitForProcsToDie(adb, serial, comm, bin) {
  return listPidsByComm(adb, serial, comm, bin).then(function(pids) {
    console.log(pids, pids.length ? 'no kill' : 'killed')
    if (pids.length) {
      return new Promise(resolve =>
        setTimeout(() => {
          resolve()
        }, 100)
      ).then(function() {
        return waitForProcsToDie(adb, serial, comm, bin)
      })
    }
  })
}

export function killProcsByComm(adb, serial, comm, bin, mode) {
  console.info('start a kill monitor')
  return listPidsByComm(adb, serial, comm, bin).then(function(pids) {
    if (!pids.length) {
      return Promise.resolve('already killed')
    }
    return (adb
        .shell(serial, ['kill', mode || -15].concat(pids))
        .then(function(out) {
          return new Promise(function(resolve) {
            out.on('end', resolve)
          })
        })
        .then(function() {
          return waitForProcsToDie(adb, serial, comm, bin)
        })
        .then(s => {
          console.info('【等待结果】', s)
          return s
        })
        // .timeout(2000)
        .catch(function(e) {
          console.info('error  catched : ', e)
          console.info('还没结束，手动继续 Kill吧')
          return killProcsByComm(adb, serial, comm, bin, -9)
        }) )
  })
}
// ----------- Private --------- //
function getAbi(properties) {
  var split = list => (list ? list.split(',') : [])
  var abi = {
    primary: properties['ro.product.cpu.abi'],
    pie: +properties['ro.build.version.sdk'] >= 16,
    all: [],
    b32: [],
    b64: []
  }

  // Since Android 5.0
  if (properties['ro.product.cpu.abilist']) {
    abi.all = split(properties['ro.product.cpu.abilist'])
    abi.b64 = split(properties['ro.product.cpu.abilist64'])
    abi.b32 = split(properties['ro.product.cpu.abilist32'])
  } else {
    // Up to Android 4.4
    abi.all.push(abi.primary)
    abi.b32.push(abi.primary)
    if (properties['ro.product.cpu.abi2']) {
      abi.all.push(properties['ro.product.cpu.abi2'])
      abi.b32.push(properties['ro.product.cpu.abi2'])
    }
  }

  console.log('Supports ABIs %s', abi.all.join(', '))

  return abi
}

// -------- Socket ----------- //
export async function getRotatorMonitor() {
  await closeRotatorMonitor()
  let device = (tracedDevices || (await listDevices()))[0]
  let apk_path = /\/.*\.apk/.exec(
    (await client
      .shell(device.id, `pm path jp.co.cyberagent.stf.rotationwatcher`)
      .then(adb.util.readAll)).toString()
  )[0]
  if (!apk_path) return console.error('no apk_path,', apk_path)
  let command = `export CLASSPATH="${apk_path}";exec app_process /system/bin jp.co.cyberagent.stf.rotationwatcher.RotationWatcher`
  // let out = await client.shell(device.id, command)
  // treatOut(out)
  return client.shell(device.id, command)
}
export async function closeRotatorMonitor() {
  let device = (tracedDevices || (await listDevices(client)))[0]
  return killProcsByComm(client, device.id, '', 'app_process', '')
}
