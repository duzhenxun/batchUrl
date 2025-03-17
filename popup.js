document.addEventListener('DOMContentLoaded', function() {
  // 初始化批量参数区域的折叠状态
  const batchHeader = document.querySelector('.batch-header');
  const batchToggle = document.querySelector('.batch-toggle');
  const batchContent = document.querySelector('.batch-content');

  // 默认折叠
  batchToggle.classList.add('collapsed');
  batchContent.classList.add('collapsed');

  // 添加点击事件
  batchHeader.addEventListener('click', function() {
    batchToggle.classList.toggle('collapsed');
    batchContent.classList.toggle('collapsed');
  });

  // 历史记录功能
  const historySelect = document.getElementById('historySelect');
  const clearHistoryBtn = document.getElementById('clearHistory');

  // 显示历史记录
  function displayHistory(history) {
    // 清空当前选项
    historySelect.innerHTML = '<option value="" disabled selected>选择历史记录</option>';
    
    // 添加历史记录选项
    history.slice().reverse().forEach(item => {
      let displayUrl = '';
      try {
        const url = new URL(item.url);
        displayUrl = url.pathname + url.search + url.hash;
      } catch (e) {
        displayUrl = item.url;
      }

      const option = document.createElement('option');
      option.value = item.url;
      option.title = item.url;
      option.textContent = `${new Date(item.timestamp).toLocaleString('zh-CN')} - ${displayUrl}`;
      historySelect.appendChild(option);
    });

    // 显示或隐藏下拉框和清空按钮
    const hasHistory = history.length > 0;
    historySelect.style.display = hasHistory ? 'block' : 'none';
    clearHistoryBtn.style.display = hasHistory ? 'block' : 'none';
  }

  // 加载历史记录
  function loadHistory() {
    chrome.storage.local.get(['urlHistory'], function(result) {
      const history = result.urlHistory || [];
      displayHistory(history);
    });
  }

  // 添加到历史记录
  function addToHistory(url) {
    chrome.storage.local.get(['urlHistory'], function(result) {
      let history = result.urlHistory || [];
      // 检查是否已存在相同URL
      const exists = history.some(item => item.url === url);
      if (!exists) {
        history.push({
          url: url,
          timestamp: new Date().getTime()
        });
        // 限制历史记录数量
        if (history.length > 10) {
          history = history.slice(-10);
        }
        chrome.storage.local.set({ urlHistory: history }, function() {
          loadHistory();
        });
      }
    });
  }

  // 清空历史记录
  clearHistoryBtn.addEventListener('click', function() {
    chrome.storage.local.remove(['urlHistory'], function() {
      loadHistory();
    });
  });

  // 选择历史记录
  historySelect.addEventListener('change', function() {
    const selectedUrl = this.value;
    if (selectedUrl) {
      urlPatternInput.value = selectedUrl;
      displayUrlParams(selectedUrl);
      // 重置选择
      this.selectedIndex = 0;
    }
  });

  // 初始化加载历史记录
  loadHistory();

  // 时间显示功能
  function displayTime() {
    const date = new Date();
    const timeString = date.toLocaleString('zh-CN', { 
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
      timeElement.textContent = timeString;
    }
  }

  displayTime();
  setInterval(displayTime, 1000);

  // 获取所有需要的DOM元素
  const urlPatternInput = document.getElementById('urlPattern');
  const uidInput = document.getElementById('uidInput');
  const concurrencyInput = document.getElementById('concurrency');
  const getCurrentUrlButton = document.getElementById('getCurrentUrl');
  const pasteUrlButton = document.getElementById('pasteUrl');
  const resultsContainer = document.getElementById('results');
  const paramNameInput = document.getElementById('paramName');
  const themeSelect = document.getElementById('theme');
  const urlParamsContainer = document.getElementById('urlParams');

  // 主题切换功能
  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    chrome.storage.local.set({ theme });
  }

  // 初始化主题
  chrome.storage.local.get(['theme'], function(result) {
    const savedTheme = result.theme || 'light';
    themeSelect.value = savedTheme;
    setTheme(savedTheme);
  });

  // 监听主题切换
  themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
  });

  // 显示URL参数
  function displayUrlParams(url) {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      urlParamsContainer.innerHTML = '';
      
      // 添加新增参数按钮
      const addParamButton = document.createElement('button');
      addParamButton.className = 'add-param-button';
      addParamButton.innerHTML = '添加参数';
      addParamButton.addEventListener('click', () => {
        const paramDiv = createParamItem('', '');
        urlParamsContainer.insertBefore(paramDiv, addParamButton);
      });
      
      // 有参数或添加按钮时显示容器
      urlParamsContainer.style.display = 'block';
      
      params.forEach((value, key) => {
        const paramDiv = createParamItem(key, value);
        urlParamsContainer.appendChild(paramDiv);
      });
      
      urlParamsContainer.appendChild(addParamButton);
    } catch (e) {
      console.error('解析URL参数失败:', e);
      // 当URL无效时，仍然显示添加参数按钮
      urlParamsContainer.innerHTML = '';
      const addParamButton = document.createElement('button');
      addParamButton.className = 'add-param-button';
      addParamButton.innerHTML = '添加参数';
      addParamButton.addEventListener('click', () => {
        const paramDiv = createParamItem('', '');
        urlParamsContainer.insertBefore(paramDiv, addParamButton);
      });
      urlParamsContainer.appendChild(addParamButton);
      urlParamsContainer.style.display = 'block';
    }
  }

  // 创建参数项
  function createParamItem(key, value) {
    const paramDiv = document.createElement('div');
    paramDiv.className = 'param-item';
    
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'param-name-input';
    keyInput.value = key;
    keyInput.placeholder = '参数名';
    
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'param-value';
    valueInput.value = value;
    valueInput.placeholder = '参数值';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-param-button';
    deleteButton.innerHTML = '删除';
    
    paramDiv.appendChild(keyInput);
    paramDiv.appendChild(document.createTextNode(' = '));
    paramDiv.appendChild(valueInput);
    paramDiv.appendChild(deleteButton);
    
    // 监听输入变化
    const updateUrlWithDelay = debounce(updateUrl, 300);
    keyInput.addEventListener('input', updateUrlWithDelay);
    valueInput.addEventListener('input', updateUrlWithDelay);
    
    // 删除参数
    deleteButton.addEventListener('click', () => {
      paramDiv.remove();
      updateUrl();
    });
    
    return paramDiv;
  }
  
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 更新URL
  function updateUrl() {
    try {
      let url = urlPatternInput.value;
      if (!url) return;
      
      const urlObj = new URL(url);
      // 清除所有现有参数
      urlObj.search = '';
      
      // 获取所有参数项
      const paramItems = urlParamsContainer.querySelectorAll('.param-item');
      paramItems.forEach(paramItem => {
        const keyInput = paramItem.querySelector('.param-name-input');
        const valueInput = paramItem.querySelector('.param-value');
        if (keyInput && valueInput && keyInput.value.trim()) {
          urlObj.searchParams.set(keyInput.value.trim(), valueInput.value);
        }
      });
      
      urlPatternInput.value = urlObj.toString();
    } catch (e) {
      console.error('更新URL失败:', e);
    }
  }

  // 监听URL输入变化
  urlPatternInput.addEventListener('input', () => {
    displayUrlParams(urlPatternInput.value);
  });

  // 获取当前页面URL
  getCurrentUrlButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      if (tab?.url) {
        urlPatternInput.value = tab.url;
        displayUrlParams(tab.url);
      }
    } catch (e) {
      console.error('获取当前页面URL失败:', e);
    }
  });

  // 粘贴URL
  pasteUrlButton.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      urlPatternInput.value = text;
      displayUrlParams(text);
    } catch (e) {
      console.error('粘贴URL失败:', e);
    }
  });

  // 解析UID输入
  function parseUidInput(input) {
    const uids = new Set();
    const lines = input.split(/[\n,]+/).map(line => line.trim()).filter(Boolean);

    lines.forEach(line => {
      if (line.includes('-')) {
        const [start, end] = line.split('-').map(num => parseInt(num.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            uids.add(i.toString());
          }
        }
      } else {
        const uid = line.trim();
        if (uid) uids.add(uid);
      }
    });

    return Array.from(uids);
  }

  // 发送请求
  async function sendRequest(url, paramInfo) {
    try {
      // 验证URL
      if (!url) {
        throw new Error('请输入URL');
      }

      // 添加到历史记录
      addToHistory(url);

      // 发送请求
      const response = await fetch(url);
      const text = await response.text();
      let data;

      // 尝试解析JSON
      try {
        data = JSON.parse(text);
      } catch (e) {
        // 如果不是JSON，直接使用文本
        data = text;
      }

      // 处理响应
      if (!response.ok) {
        return { 
          success: false, 
          error: `请求失败: ${response.status} ${response.statusText}`, 
          paramInfo,
          data
        };
      }

      return { 
        success: true, 
        data, 
        paramInfo,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      console.error('请求错误:', error);
      return { 
        success: false, 
        error: error.message, 
        paramInfo 
      };
    }
  }

  // 批量发送请求
  async function batchRequest(urlPattern, paramName, uids, concurrency) {
    if (!urlPattern) {
      throw new Error('请输入URL');
    }

    const results = [];
    const queue = [];

    // 处理批量参数
    if (uids && uids.length > 0) {
      for (const uid of uids) {
        let finalUrl = urlPattern;
        try {
          const url = new URL(urlPattern);
          url.searchParams.set(paramName, uid);
          finalUrl = url.toString();
        } catch (e) {
          console.error('URL解析失败:', e);
          throw new Error('无效的URL格式');
        }
        
        queue.push({
          url: finalUrl,
          paramInfo: { name: paramName, value: uid }
        });
      }
    } else {
      // 如果没有批量参数，直接请求原始URL
      queue.push({
        url: urlPattern,
        paramInfo: { name: '', value: '' }
      });
    }

    const inProgress = new Set();

    try {
      while (queue.length > 0 || inProgress.size > 0) {
        while (inProgress.size < concurrency && queue.length > 0) {
          const { url, paramInfo } = queue.shift();
          const promise = sendRequest(url, paramInfo)
            .then(result => {
              inProgress.delete(promise);
              return { url, ...result };
            })
            .catch(error => {
              inProgress.delete(promise);
              return { 
                url, 
                success: false, 
                error: error.message,
                paramInfo 
              };
            });
          inProgress.add(promise);
          results.push(promise);
        }

        if (inProgress.size > 0) {
          await Promise.race(Array.from(inProgress));
        }
      }

      return Promise.all(results);
    } catch (error) {
      throw new Error(`批量请求失败: ${error.message}`);
    }
  }

  // 显示结果
  function formatJSON(jsonStr) {
    try {
      const obj = JSON.parse(jsonStr);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonStr;
    }
  }

  // 全局展开/收起函数
  // 全局展开/收起函数
  function initializeJSONHandlers() {
    document.addEventListener('click', function(event) {
      const header = event.target.closest('.json-header');
      if (header) {
        const container = header.closest('.json-container');
        if (container) {
          const isCollapsed = container.classList.contains('json-collapsed');
          if (isCollapsed) {
            container.classList.remove('json-collapsed');
            header.classList.add('expanded');
          } else {
            container.classList.add('json-collapsed');
            header.classList.remove('expanded');
          }
        }
      }

      const expandAllBtn = event.target.closest('.json-expand-all');
      if (expandAllBtn) {
        const container = expandAllBtn.closest('.json-container');
        if (container) {
          container.classList.remove('json-collapsed');
          container.querySelector('.json-header')?.classList.add('expanded');
        }
      }

      const collapseAllBtn = event.target.closest('.json-collapse-all');
      if (collapseAllBtn) {
        const container = collapseAllBtn.closest('.json-container');
        if (container) {
          container.classList.add('json-collapsed');
          container.querySelector('.json-header')?.classList.remove('expanded');
        }
      }
    });
  }

  // 初始化事件处理程序
  initializeJSONHandlers();

  // 添加JSON交互事件
  function setupJSONInteraction(container) {
    // 折叠/展开切换
    container.querySelectorAll('.json-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const block = e.target.closest('.json-block');
        if (block) {
          block.classList.toggle('collapsed');
        }
      });
    });
  }

  function displayResult(result) {
    if (!resultsContainer) return;

    if (resultsContainer.style.display === 'none' || !resultsContainer.style.display) {
      resultsContainer.style.display = 'block';
      resultsContainer.style.opacity = '0';
      setTimeout(() => {
        resultsContainer.style.opacity = '1';
      }, 10);
    }

    const item = document.createElement('div');
    item.className = `request-item ${result.success ? 'success' : 'error'}`;
    
    let resultContent = '';
    if (result.success) {
      try {
        let jsonData;
        if (typeof result.data === 'object') {
          jsonData = result.data;
        } else {
          jsonData = JSON.parse(result.data);
        }

        if ('dm_error' in jsonData) {
          let dataContent = '';
          if (jsonData.data) {
            let rawData;
            if (typeof jsonData.data === 'object') {
              rawData = JSON.stringify(jsonData.data, null, 2);
            } else {
              // 替换img标签为固定文本
              rawData = jsonData.data.replace(/<img[^>]*>/g, '图片地址');
            }
            
            // 检查数据长度
            if (rawData.length <= 250) {
              if (typeof jsonData.data === 'object') {
                dataContent = rawData;
              } else {
                // 转义HTML字符
                dataContent = rawData
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
              }
            } else {
              dataContent = '[...]' + rawData.length + '字';
            }
          }
          resultContent = `<div class="json-info">
            <div>dm_error: ${jsonData.dm_error}</div>
            <div>error_msg: ${jsonData.error_msg || '-'}</div>
            <div class="data-field">data: ${dataContent || '-'}</div>
          </div>`;
        } else {
          resultContent = `<div class="json-info">
            <div>status: ${result.status}</div>
          </div>`;
        }
      } catch (e) {
        // 非JSON数据，显示状态码
        resultContent = `<div class="json-info">
          <div>status: ${result.status}</div>
        </div>`;
      }
    } else {
      resultContent = `<div class="error">${result.error}</div>`;
    }

    if (resultContent) {
      item.innerHTML = `
        <div class="result-url">${result.url}</div>
        ${result.paramInfo.name ? `<div class="result-param">${result.paramInfo.name}=${result.paramInfo.value}</div>` : ''}
        ${resultContent}
      `;
      resultsContainer.insertBefore(item, resultsContainer.firstChild);
    }
  }

  // 初始化开始请求按钮
  const startButton = document.getElementById('startRequest');
  if (startButton) {
    startButton.addEventListener('click', async () => {
      try {
        // 获取输入值
        const urlPattern = urlPatternInput.value.trim();
        const paramName = paramNameInput.value.trim();
        const uids = parseUidInput(uidInput.value);
        const concurrency = 5; // 设置固定并发数

        // 验证URL
        if (!urlPattern) {
          throw new Error('请输入URL');
        }

        // 清空并显示结果容器
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'block';
        resultsContainer.style.opacity = '0';
        setTimeout(() => {
          resultsContainer.style.opacity = '1';
        }, 10);

        // 禁用按钮
        startButton.disabled = true;

        // 发送请求
        console.log('开始发送请求:', { urlPattern, paramName, uids, concurrency });
        const results = await batchRequest(urlPattern, paramName, uids, concurrency);
        
        // 显示结果
        console.log('请求结果:', results);
        results.forEach(displayResult);
      } catch (error) {
        console.error('请求错误:', error);
        const errorItem = document.createElement('div');
        errorItem.className = 'request-item error';
        errorItem.innerHTML = `<div><strong>错误:</strong> ${error.message}</div>`;
        resultsContainer.appendChild(errorItem);
      } finally {
        // 恢复按钮
        startButton.disabled = false;
      }
    });
  } else {
    console.error('找不到开始请求按钮');
  }
});