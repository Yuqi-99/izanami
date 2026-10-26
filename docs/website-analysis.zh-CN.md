# Izanami 原站分析与 React 复刻说明

检查日期：2026-10-26。范围为现有模板的首页、响应式布局、菜单和鼠标效果；没有新增原站所有内页或表单后端。

## 依据与可信度

检查了原站 HTML、发布后的 JavaScript/CSS、实际浏览器画面，并下载和抽帧对照用户提供的四段视频（顺序：mobile、tablet、desktop、cursor）。视频长度分别约为 28.07、22.05、33.61、24.58 秒。视频中的 tablet 是较宽浏览器录屏；不能据此断言它运行在真实触屏平板上。因此实现同时区分屏幕宽度与 pointer/hover 能力。

原站公开资源：

- 首页：https://izanami-official.com/
- 检查时的脚本：https://izanami-official.com/assets/js/index.PhJuwueo.js
- 检查时的样式：https://izanami-official.com/assets/css/index.By0AFpwc.css

资源文件名可能随原站发布而变化。以下“确认”表示能在这些公开资源中找到证据，不代表拿到了原始仓库。

## 原站用了什么

| 技术 | 判断 | 用途与证据 |
| --- | --- | --- |
| Three.js / WebGL | 确认 | 脚本包含 WebGLRenderer、纹理、render target、shader；图像和部分文字通过 mesh 管理器进入 GPU 场景。 |
| GSAP | 确认 | 有 GSAP 核心和页面动画调用，管理加载、出场、菜单及过渡的时间插值。 |
| Lenis | 确认 | 存在 Lenis 实现，发布包含版本字符串 1.3.17；平滑滚动与逐帧更新衔接。 |
| Swup | 确认 | 存在 swup.hooks、page:view、navigate，用于跨页替换和过渡。 |
| Alpine.js | 确认 | 存在 Alpine.start()、initTree()、contactForm 数据组件，承担局部 DOM 状态与表单交互。 |
| CSS Grid / vw / sticky / media query | 确认 | 原站大量采用 vw 尺寸、grid 排版、position:sticky；主要布局断点为 768px，并检测 hover/pointer。 |
| WebP 图片 + SVG 标志 | 确认 | 图片有独立 desktop / sp（小屏）版本；首页森林和室内场景主要由静态图片组成。 |
| Cinzel / Playfair Display / Shippori Mincho | 确认 | 样式及浏览器加载字体可核实：导航、英文标题、正文分别使用这些衬线字体。 |
| Google Analytics | 确认 | HTML 引用了 Google Tag Manager 的 gtag.js。本地复刻不需要接入原站统计账号。 |
| Vite 或类似 ESM 打包器 | 推测 | module script、crossorigin、哈希资源命名和 modulepreload 与这类构建产物一致；不足以确认具体构建工具及版本。 |
| 原始 TypeScript、CMS、后端、服务器框架 | 无法确认 | 发布后的浏览器资源不足以判断原始语言和服务端实现。 |

没有足够证据把原站判定为 React、Next.js、Vue 页面应用或 Tailwind 项目。Alpine 的响应式依赖包含部分 Vue reactivity 标记，这不等于整站使用 Vue。GSAP 核心含 ScrollTrigger 的挂接字符串，也不等于安装并使用了 ScrollTrigger；本站还有自定义滚动计算。

## 画面是怎么做的

### 1. 首屏并不是一段森林背景视频

它由森林 WebP、两层透明云雾、短句、固定 Logo 与导航、页脚时钟组成。云层以不同尺寸缓慢横移。滚动时，图片位置、透明度和文字显隐分别变化，因此产生景深和雾气散开的感觉。

一个关键尺寸：桌面森林图按接近 100vw × 100vw 的画幅呈现，手机图高约 296.27vw；视口只显示其中一部分。直接把它放进 height:100vh 的 object-fit:cover，会把树木裁到错误的位置。这是旧模板首屏不够像的主要原因。

### 2. 森林 → philosophy → 室内场景是一条连续滚动叙事

桌面 philosophy 内容浮在室内背景上；室内背景移动慢于文字。顶部大面积暗屋顶提供文字可读性，继续滚动才露出窗、桌子和地面。不能只做每个区块各一张背景再切换。

手机则使用独立构图：黑底、上方小方图、标题正文、右下叠图，之后才进入项目介绍和高幅室内图。它不是把桌面等比例缩小。

### 3. 标题、图片和按钮各有独立动画

标题按行依次揭示，并有短暂扭曲；图片带遮罩和轻微缩放；按钮使用一条线和上下两份文字实现 hover 翻动。进入视口的触发条件应观察未被遮罩裁空的外层，否则 clip-path:inset(...100%) 会让观察器一直认为元素不可见。

### 4. Projects 的堆叠效果

桌面项目使用 sticky 位置和滚动轨道，下一项逐渐覆盖上一项，图像与文字并非简单一起平移。手机以阅读顺序纵向排列，触屏设备不需要模拟桌面鼠标。

### 5. Cursor 是流体位移，不是一个跟随鼠标的圆

原站将鼠标速度注入速度场，再做散度、压力、梯度消除和平流等计算，最后用生成的位移扭曲场景纹理。代码中可见 cursorSize:0.5、cursorPower:25、distortionPower:0.5。参数相同仍不代表效果完全相同，因为场景合成、分辨率、时间步和材质都会影响结果。

普通 CSS blur 或 Motion 的 x/y 只能移动整个元素，不能让字形和图片局部像水一样被拉开。Motion 适合驱动动画参数；实际像素位移需要 WebGL shader（也可以用 Three.js 封装）。

## React + Tailwind + Motion + TypeScript 是否可行

完全可行，并且现有项目已经采用这套方案。

| 责任 | 当前实现 |
| --- | --- |
| 页面组件和菜单状态 | React + TypeScript |
| 字体、布局、响应式构图 | Tailwind CSS 4 + App.css |
| 进入视口动画 | Motion 的 useInView / whileInView |
| 随滚动连续变化 | Motion 的 useScroll + useTransform |
| 滚轮惯性 | 已安装的 Lenis |
| 水波扭曲 | 原生 WebGL2 + GLSL，在 React effect 中管理和清理资源 |
| 打包 | Vite |

不必再同时安装 GSAP、Swup、Alpine 或 Three.js。需要所有内页时，可以另加 React 路由和转场；当前首页改进不需要为了模拟原站技术栈而引入额外框架。

Tailwind 和自定义 CSS 可以共存。此类 vw 构图、关键帧、伪元素、复杂层级放进专用 CSS 更容易审阅；没有必要把每个样式都强行转为 utility class。

Motion 的官方说明区分了 scroll-triggered 与 scroll-linked 两类动画，正好对应这里的出场与视差：https://motion.dev/docs/react-scroll-animations

## 本轮改动

- 首屏恢复高幅图片与顶部取景，滚动时向上移动森林；避免首屏树木过早进入画面。
- 修正桌面 Logo 大小、语言切换横向位置、手机导航顶部间距与常驻小圆点。
- 将垂直 section label 移出正文排版流，消除标题整体被标签高度向下推移的问题。
- 调整标题行高和字距，保留原有本地字体。
- 室内背景改为高幅画面，并调整滚动位移，使屋顶、窗和桌子的出现顺序接近参考。
- 手机 Projects 增加自己的室内 picture，标题置于顶部，取消原来多余的 65vw 空白；桌面介绍也提前。
- 取消 768–1023px 特有的列宽覆盖，回到原站主要采用的两档布局；真实触屏仍不启动桌面 cursor 效果。
- 图片只使用一套出场遮罩，观察不受 clip-path 影响的父容器，避免两套动画相互阻塞。
- 首屏和正文共用现有全局流体渲染器，避免两套不同算法在鼠标经过文字时分离。
- 水波快照加入背景，输出按位移后的画面覆盖原位置，减少原文字与扭曲文字叠加的重影；同时纳入场景暗化层。
- 水纹标题的 SVG 动画在进入视口时主动启动，而不是依赖文档全局时间。
- 修正按钮出场的可见性检测，避免只显示横线而缺少文字；手机 Company 按内容撑开，避免底部链接被裁切。
- 修正后续区块层级，防止固定室内背景透过 Company 和页脚。
- 保留无 WebGL 时的 DOM 页面以及触屏/减少动画偏好下的降级；菜单按钮补充准确的可访问名称。

旧的 HeroFluidImage.tsx 保留在仓库供参考，但首页已经不再挂载它。

## Skills 需要 import 吗

不需要在 React 代码中 import skill，也不需要把 skill 写进 package.json。

Skill 是给 Codex 的工作说明与可选脚本；npm 包才是网站运行时依赖。此次使用已经可用的 Playwright skill 来浏览原站、保存截图并检查响应式与交互。已有本地原图和视频，无须安装 image generation、Figma 或 Google Drive 插件才能完成本轮工作。

以后如果常做这类项目，可以建立一份团队复用的视觉对照 skill，约定断点、截图方式、动画降级和验收步骤；这不是实现网页的前提。本轮没有额外安装 skills。

官方定义：https://developers.openai.com/plugins/concepts/skills

## 相似度与范围

目标是约 80% 的整体观感，而不是有量化依据的“已达到 80%”认证。字体栅格化、原站完整的 WebGL mesh 场景、页面切换着色器和精确滚动曲线仍可能不同。本地 cursor 使用 DOM 内容重绘成纹理，是有意保留的近似实现，不等同于原站完整渲染引擎。

现有 View 按钮主要仍是首页锚点；日文完整站点、各项目详情页、隐私页和联系表单不在本轮新建范围，不能把本地首页当作已经复制全部内页的网站。

本地预览：npm run dev。生产检查：npm run build。对照截图与视频关键帧保存在 output/playwright/。

## 验证记录

- `npm run lint`：通过。
- `npm run build`：TypeScript 检查及 Vite 生产构建通过。
- 桌面 1440 × 900、手机 402 × 874：浏览器截图对照；检查横向溢出和图片加载。
- 平板 820 × 1180，启用触屏模拟：检查布局、运行时异常及 cursor canvas 不挂载。
- 菜单打开锁定滚动、Escape 关闭、选择 Company 后关闭并跳转：通过。
- 减少动画偏好：加载结束、图片可见、不挂载流体 canvas。
- 鼠标轨迹：保存文字位移截图，检查静止画面和移动中画面。
- 手机 Company：检查按钮文字可见，按钮位于区块边界内。

限制：以上是 Chromium 浏览器验证，并非真实 iPhone/iPad Safari 或所有 GPU 的兼容性认证。仓库原有 Vite `__dirname` 和 ESLint `.eslintignore` 弃用提示仍存在，不影响本次构建通过。
