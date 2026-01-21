export const getDeviceToken = () => {
  const KEY = 'device_token'
  let t = localStorage.getItem(KEY)
  if (!t) {
    t =
      crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(KEY, t)
  }
  return t
}

export const getConnectDevice = () => {
  const ua = navigator.userAgent
  let result = ''

  if (/macintosh|iPhone|iPad|iPod/i.test(ua)) {
    result = 'ios'
  } else if (/Android/i.test(ua)) {
    result = 'android'
  } else {
    result = 'pc'
  }
  return result
}

export const getConnectBrowser = () => {
  const agt = navigator.userAgent.toLowerCase()
  let result = ''

  if (agt.indexOf('mac') != -1) {
    if (agt.indexOf('macintosh') != -1) {
      result = 'Safari'
    } else {
      result = 'Chrome'
    }
  } else if (agt.indexOf('edg') != -1) result = 'edg'
  else if (agt.indexOf('samsung') != -1) result = 'Samsung'
  else if (agt.indexOf('chrome') != -1) result = 'Chrome'
  else if (agt.indexOf('opera') != -1) result = 'Opera'
  else if (agt.indexOf('staroffice') != -1) result = 'Star Office'
  else if (agt.indexOf('webtv') != -1) result = 'WebTV'
  else if (agt.indexOf('beonex') != -1) result = 'Beonex'
  else if (agt.indexOf('chimera') != -1) result = 'Chimera'
  else if (agt.indexOf('netpositive') != -1) result = 'NetPositive'
  else if (agt.indexOf('phoenix') != -1) result = 'Phoenix'
  else if (agt.indexOf('firefox') != -1) result = 'Firefox'
  else if (agt.indexOf('safari') != -1) result = 'Safari'
  else if (agt.indexOf('skipstone') != -1) result = 'SkipStone'
  else if (agt.indexOf('netscape') != -1) result = 'Netscape'
  else if (agt.indexOf('mozilla/5.0') != -1) result = 'Mozilla'
  else if (agt.indexOf('msie') != -1) {
    let rv = -1
    if (navigator.appName == 'Microsoft Internet Explorer') {
      let ua = navigator.userAgent
      var re = new RegExp('MSIE ([0-9]{1,}[.0-9]{0,})')
      if (re.exec(ua) != null) rv = parseFloat(RegExp.$1)
    }
    result = 'Internet Explorer ' + rv
  }

  return result
}
