/**
 * @file: pack.js
 * @author kalo
 * ver: 1.0.1
 * update: 2020/07/09
 * https://github.com/vkalo/pack
 */

/* eslint-disable no-unused-vars */
var opener;
var pack;
(function (global) {
  // avoid duplicate definitions
  if (opener) {
    return;
  }

  var head = document.getElementsByTagName('head')[0];
  var loadingMap = {}; //callback
  var loadingStateMap = {}; //async state
  var factoryMap = {};
  var modulesMap = {};
  var resourceMap = {};

  // packing function
  pack = function (id, deps, factory) {
    factoryMap[id] = factory;

    resourceMap[id] = deps || [];

    deps.forEach(function (id) {
      opener.async(id);
    });
    var check = checkUp(id);

    if (!check()) {
      deps.forEach(function (childId) {
        loadingStateMap[childId] || loadingMap[childId].push(check);
      });
    }
  };
  // loading moudle function
  opener = function (id, onload, onerror) {
    if (typeof id !== 'string') {
      throw new Error('请输入正确的模块名称');
    }

    var mod = modulesMap[id];

    if (mod) {
      onload && onload.call(global, mod.exports);
      return mod.exports;
    }

    var factory = factoryMap[id];
    if (!factory || !loadingStateMap[id]) {
      return opener.async.call(
        this,
        id,
        function () {
          mod = opener(id);
          onload && onload.call(global, mod);
        },
        onerror,
      );
    } else {
      mod = modulesMap[id] = {
        exports: {},
      };

      // factory: function OR value
      var ret =
        typeof factory === 'function'
          ? factory.apply(mod, [opener, mod.exports, mod])
          : factory;

      if (ret) {
        mod.exports = ret;
      }
      onload && onload.call(global, mod.exports);
      return mod.exports;
    }
  };

  // aysnc loading moudle
  opener.async = function (id, onload, onerror) {
    if (typeof id !== 'string') {
      throw new Error('请输入正确的模块名称');
    }
    var url = opener.baseUrl + id;
    var queue = loadingMap[id] || (loadingMap[id] = []);

    typeof onload === 'function' && queue.push(onload);
    if (id in loadingStateMap) {
      loadingStateMap[id] && loadOver(id);
    } else {
      loadingStateMap[id] = false;
      switch (id.split('.').pop()) {
        case 'js': {
          loadScripts(id, url, onerror);
          break;
        }
        case 'json': {
          loadJson(id, url, onerror);
          break;
        }
        case 'css': {
          loadCss(id, url, onerror);
          break;
        }
        default: {
          factoryMap[id] = url;
          loadOver(id);
          return url;
        }
      }
    }
  };

  // query exist
  opener.exist = function (id) {
    return id in modulesMap || id in factoryMap
  }

  // async config
  opener.baseUrl = '';
  opener.timeout = 5000;

  var loadScripts = function (id, url, onerror) {
    var script = document.createElement('script');

    typeof onerror === 'function' && loadError(id, script, onerror);
    script.type = 'text/javascript';
    script.src = url;
    head.appendChild(script);
  };

  var loadJson = function (id, url, onerror) {
    var xhr = new XMLHttpRequest();

    xhr.open('get', url);
    typeof onerror === 'function' && loadError(id, xhr, onerror);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status === 200) {
        factoryMap[id] = JSON.parse(xhr.responseText);
        loadOver(id);
      }
    };
    xhr.send();
  };

  var loadCss = function (id, url, onerror) {
    var link = document.createElement('link');
    link.href = url;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    head.appendChild(link);
    typeof onerror === 'function' && loadError(id, link, onerror);
    link.onload = function () {
      factoryMap[id] = true;
      loadOver(id);
    };
  };

  var loadOver = function (id) {
    loadingStateMap[id] = true;

    var queue = loadingMap[id];
    if (queue) {
      for (var i = 0, n = queue.length; i < n; i++) {
        queue[i]();
      }
      delete loadingMap[id];
    }
  };

  var loadError = function (id, element, onerror) {
    var tid = setTimeout(function () {
      onerror(id);
    }, opener.timeout);

    element.onerror = function () {
      clearTimeout(tid);
      onerror(id);
    };

    var onload = function () {
      clearTimeout(tid);
    };

    if ('onload' in element) {
      element.onload = onload;
    } else {
      element.onreadystatechange = function () {
        if (this.readyState === 'loaded' || this.readyState === 'complete') {
          onload();
        }
      };
    }
  };

  // check resource loaded
  var checkUp = function (id) {
    var resourceList = resourceMap[id].filter(function (i) {
      return !resourceMap[i];
    });

    return function () {
      if (loadingStateMap[id]) {
        return true;
      }
      for (var i = resourceList.length - 1; i >= 0; i--) {
        var resourceId = resourceList[i];
        if (!loadingStateMap[resourceId]) {
          return false;
        }
      }

      loadOver(id);
      return true;
    };
  };

})(this);

module && (module.exports = { opener, pack });