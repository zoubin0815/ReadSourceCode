const Koa = require("koa");
const fs = require('fs');
const path = require('path')
const app = new Koa();
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')
function rewriteImport(content){
    // 正则
    return content.replace(/ from ['|"]([^'"]+)['|"]/g , function(s0,s1){
        if(s1[0] !== '.' && s1[1] !== '/'){
            return `from '/@modules/${s1}'`
        }else{
            return s0
        }
    })
}

app.use(async (ctx) => {
    const {url , query} = ctx.request;
    console.log('url:' + url)
    if(url === '/'){
        ctx.type = 'text/html'
        let content = fs.readFileSync('index.html','utf-8');
        // 入口文件 加入环境变量
        content = content.replace('<script',
        `
        <script>
            window.process = {env : {NODE_ENV:'dev'}}
        </script>
        <script
        `
        )
        ctx.body = content
    }

    // *.js ==> src/*.js
    else if(url.endsWith('.js')){
        // /src/main.js ==> xxx/src/main.js
        const p = path.resolve(__dirname,url.slice(1))
        
        const content = fs.readFileSync(p,'utf-8');
        console.log(rewriteImport(content))
        ctx.type = 'application/javascript'
        ctx.body = rewriteImport(content)

    }
    
    // 第三方库的支持
    // 需要改写 欺骗一下浏览器  'vue' ==> '/@modules' => 别名
    // from 'xxx'
    // vue ==> node_modules/***
    else if(url.startsWith('/@modules')){
        // /@modules/vue =>代码的位置/node_modules/vue/ 的es模块入口
        // 读取node_modules中对应库的packjson的module属性
        const prefix = path.resolve(__dirname,'node_modules',url.replace('/@modules/',''))
        const module = require(prefix + '/package.json').module
        const p = path.resolve(prefix,module)
        const ret = fs.readFileSync(p,'utf-8')
        ctx.type = 'application/javascript'
        ctx.body = rewriteImport(ret)
    }

    // 支持SFC组件  单文件组件
    // *.vue => 
    
    else if(url.indexOf('.vue') > -1){
        // 第一步 vue文件 => template script (complier-sfc 将.vue文件拆分为三部分template、script、css到一个对象)
        // /*.vue?type=template
        const p = path.resolve(__dirname,url.split('?')[0].slice(1));
        const {descriptor} = compilerSfc.parse( fs.readFileSync(p,'utf-8'));
        if(!query.type){
            // descriptor => js + template生成render部分
            ctx.type = 'application/javascript'
            ctx.body = `${rewriteImport(descriptor.script.content.replace("export default","const __script = "))}
            import {render as __render} from "${url}?type=template"
            __script.render = __render
            export default __script
            `
        }else{
            // 第二步 template模板 => render函数 (compiler-dom)
            const template = descriptor.template
            const render = compilerDom.compile(template.content,{mode:"module"})
            ctx.type = 'application/javascript'
            ctx.body = rewriteImport(render.code)
        }
    }else if(url.endsWith('.css')){
        const p = path.resolve(__dirname,url.slice(1))
        const file = fs.readFileSync(p,'utf-8')
        // css转化为js代码
        // 利用js 添加一个style标签
        console.log(file)
        const content = `
        const css = "${file.replace(/\s/g,"")}"
        let link = document.createElement('style')
        link.setAttribute('type','text/css')
        document.head.appendChild(link)
        link.innerHTML = css
        export default css
        `;
        ctx.type = 'application/javascript'
        ctx.body = content
    }

});


app.listen(3000,()=>{
    console.log("Vite start at 3000")
    console.log("http://localhost:3000")
})