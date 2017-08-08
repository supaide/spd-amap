let DefaultConfig = {
  url: 'http://webapi.amap.com/maps',
  version: '1.3',
  key: ''
}

let DefaultMarkerImg = {
  'red': 'http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
  'blue': 'http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
}

let init = function (id, options, callback, addCenterMarker) {
  initCtx = null
  initParams = null
  delete window.__amap__init0__
  this.map = new AMap.Map(id, options)
  this.centerXY = [0, 0]
  this.map.on('complete', () => {
    document.querySelector('#'+id+' a').removeAttribute('href')
    document.querySelector('#'+id+' .amap-copyright').remove()
    this.updateCenter()
    if (addCenterMarker) {
      
    }
    callback && callback()
  })
}

let initCtx = null
let initParams = null

window.__amap__init0__ = function () {
  if (!initCtx) {
    return
  }
  init.apply(initCtx, initParams)
}

let amap = function (id, options, callback, jsLoader, config, addCenterMarker) {
  if (typeof jsLoader !== 'function' && typeof AMap === 'undefined') {
    throw new Error('There is no loader to load AMap')
  }
  config = config || {}
  for (let k in DefaultConfig) {
    if (!config[k]) {
      config[k] = DefaultConfig[k]
    }
  }
  if (typeof AMap === 'undefined') {
    initCtx = this
    initParams = [id, options, callback, addCenterMarker]
    // Error: It isn't possible to write into a document from an asynchronously-loaded external script
    // 由于chrome 阻止异步写入，改成异步加载高德地图的方案
    jsLoader(config.url + '?v='+config.version + '&key=' +config.key+'&callback=__amap__init0__')
  } else {
    init.call(this, id, options, callback, addCenterMarker)
  }
}

amap.prototype.getMap = function () {
  return this.map
}

amap.prototype.getCenter = function () {
  let center = this.map.getCenter()
  return [center.getLng(), center.getLat()]
}

amap.prototype.getCenterXY = function () {
  return this.centerXY
}

amap.prototype.updateCenter = function (poi, zoom, callback) {
  if (typeof poi === 'string') {
    poi = poi.split(',')
  }
  if (poi && zoom) {
    this.map.setZoomAndCenter(zoom, poi)
  } else if (poi) {
    this.map.setCenter(poi)
  }
  if (!poi) {
    let lnglat = this.map.getCenter()
    poi = [lnglat.getLng(), lnglat.getLat()]
  }
  if (!zoom) {
    zoom = this.map.getZoom()
  }
  let pixel = this.map.lnglatToPixel(poi, zoom)
  this.centerXY[0] = pixel.getX()
  this.centerXY[1] = pixel.getY()
  callback && callback()
}

amap.prototype.getService = function (serviceName, callback) {
  if (typeof AMap[serviceName] !== 'undefined') {
    callback && callback()
  } else {
    AMap.service('AMap.'+serviceName, callback)
  }
}

amap.prototype.poiSearch = function (text, options, callback) {
  if (!text) {
    callback && callback(null)
    return
  }
  this.getService('PlaceSearch', function () {
    let placeSearch = new AMap.PlaceSearch(options)
    placeSearch.search(text, function (status, result) {
      let ret = null
      if (status === 'complete' && result.info === 'OK') {
        ret = result.poiList
      }
      callback && callback(ret)
    })
  })
}

amap.prototype.nearbySearch = function (poi, options, callback, radius) {
  radius = radius || 200
  if (typeof poi === 'string') {
    poi = poi.split(',')
  }
  let placeSearch = new AMap.PlaceSearch(options)
  placeSearch.searchNearBy('', poi, radius, function (status, result) {
    let ret = null
    if (status === 'complete' && result.info === 'OK') {
      ret = result.poiList
    }
    callback && callback(ret)
  })
}

amap.prototype.addMarker = function (poi, callback, options, icon) {
  if (!icon || !DefaultMarkerImg[icon]) {
    icon = 'blue'
  }
  options = options || {}
  icon = DefaultMarkerImg[icon]
  this.getService('Marker', () => {
    if (!options.icon) {
      options.icon = icon
    }
    if (!options.position) {
      options.position = (typeof poi === 'string') ? poi.split(',') : poi
    }
    if (typeof options.type === 'undefined') {
      options.type = '餐饮服务|商务住宅|生活服务'
    }
    let marker = new AMap.Marker(options)
    marker.setMap(this.map)
    callback && callback(marker)
  })
}

amap.prototype.clearMarkers = function (markers) {
  if (Object.prototype.toString.call(markers) !== "[object Array]") {
    markers = [markers]
  } else {
    if (markers.length < 1) {
      return
    }
  }
  this.map.remove(markers)
}

amap.prototype.addToolBar = function (options) {
  options = options || {}
  if (this.toolBar) {
    return
  }
  this.getService('ToolBar', () => {
    if (!options.position) {
      options.position = 'RB'
    }
    if (typeof options.visible === 'undefined') {
      options.visible = true
    }
    options.liteStyle = true
    this.toolBar = new AMap.ToolBar(options)
    this.map.addControl(this.toolBar)
  })
}

export default amap
