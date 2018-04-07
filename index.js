var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    pink:0xF5986E,
    brownDark:0x23190f,
    blue:0x68c3c0
};
window.addEventListener('load', init, false);
function init() {
    // 创建场景，相机和渲染器
    createScene();
    // 添加光源
    createLights();

    //添加空气
    createAir();
    // 添加对象
    createPlane();
    createSea();
    createSky();
    //  启动渲染器
    renderer.render(scene, camera);

    // 调用循环函数，在每帧更新对象的位置和渲染场景
    loop();
    //添加监听器
    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('mousewheel', mousewheel, false);
    //document.addEventListener('mousedown', handmousedown, false);

}

var scene, camera, fieldOfView, aspectRatio, nearPlane,
    farPlane, HEIGHT, WIDTH, renderer, container;
function createScene() {
// 获得屏幕的宽和高，
// 用佢地设置相机的纵横比
// 拿到渲染器的大小
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // 创建场景
    scene = new THREE.Scene();

    // 起场景入边添加雾的效果；样式上使用和背景一样的颜色
   scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // 创建相机
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    /**
     * PerspectiveCamera 透视相机
     * @param fieldOfView 视角
     * @param aspectRatio 纵横比
     * @param nearPlane 近平面
     * @param farPlane 远平面
     */
    camera = new THREE.PerspectiveCamera(
        //添加必要属性
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // 设置相机的位置（平面）
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;
    //球体角度的相机方向
    camera.lookAt(new THREE.Vector3(500, 50, 0));

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
        // 在 css 中设置背景色透明显示渐变色
        alpha: true,
        // 开启抗锯齿，但这样会降低性能。 不是核显级垃圾gpu  问题不大
       antialias:true
    });

    // 定义渲染器的尺寸；在这里它会填满整个屏幕
    renderer.setSize(WIDTH, HEIGHT);

    // 打开渲染器的阴影地图
    renderer.shadowMap.enabled = true;

    // 在 HTML 创建的容器中添加渲染器的 DOM 元素
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // 监听屏幕，缩放屏幕更新相机和渲染器的尺寸
    window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
    // 更新渲染器的高度和宽度以及相机的纵横比
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}
////////////////////////////////////////////////光源部分
var hemisphereLight, shadowLight ,abc;
function createLights() {

    // 半球光就是渐变的光；
    // 第一个参数是天空的颜色，第二个参数是地上的颜色（光照会影响地上颜色  有坑），第三个参数是光源的强度
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9);

   // 环境光源修改场景中的全局颜色和使阴影更加柔和
    abc = new THREE.AmbientLight(0xdc8874, .5);

    // 方向光是从一个特定的方向的照射
    // 类似太阳，即所有光源是平行的
    // 第一个参数是关系颜色，第二个参数是光源强度
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // 设置光源的方向。
    // 位置不同，方向光作用于物体的面也不同，看到的颜色也不同
    shadowLight.position.set(150, 350, 350);

    // 开启光源投影
    shadowLight.castShadow = true;

    // 定义可见域的投射阴影
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // 定义阴影的分辨率；虽然分辨率越高越好，吃性能选项，不要搞太变态就可以了
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    scene.add(abc);
    // 为了使这些光源有效果体，需要将它们添加到场景中
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

Sea = function(){
    var geom = new THREE.CylinderGeometry(600,600,800,40,10);
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

    // 重点：通过合并顶点，我们确保海浪的连续性
    geom.mergeVertices();

    // 获得顶点
    var l = geom.vertices.length;

    // 创建一个新的数组存储与每个顶点关联的值：
    this.waves = [];

    for (var i=0; i<l; i++){
        // 获取每个顶点
        var v = geom.vertices[i];

        // 存储波浪（顶点）关联的数值
        this.waves.push({y:v.y,
            x:v.x,
            z:v.z,
            // 随机角度
            ang:Math.random()*Math.PI*1,
            // 随机距离
            amp:5 + Math.random()*10,
            // 在0.016至0.048度/帧之间的随机速度
            speed:0.016 + Math.random()*0.099
        });
    };
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.brown,
        transparent:true,
        opacity:.9,
        shading:THREE.FlatShading,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
}

// 创建一个在每帧可以调用的函数，用于更新顶点的位置来模拟海浪。

Sea.prototype.moveWaves = function (){

    // 获取顶点
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;

    for (var i=0; i<l; i++){
        var v = verts[i];

        // 获取关联的值
        var vprops = this.waves[i];

        // 更新顶点的位置
        v.x = vprops.x + Math.sin(vprops.ang)*vprops.amp;
        v.y = vprops.y + Math.cos(vprops.ang)*vprops.amp;

        // 下一帧自增一个角度
        vprops.ang += vprops.speed;
    }

    // 告诉渲染器代表大海的几何体发生改变
    // 事实上，为了维持最好的性能
    // Three.js 会缓存几何体和忽略一些修改
    // 除非加上这句
    this.mesh.geometry.verticesNeedUpdate=true;
    sea.mesh.rotation.z += .005;
}

//实例化大海对象，并添加至场景
var sea;

function createSea(){
    sea = new Sea();

    // 在场景底部，稍微推挤一下
    sea.mesh.position.y = -600;

    // 添加大海的网格至场景
    scene.add(sea.mesh);
}

Cloud = function(){
    // 创建一个空的容器放置不同形状的云
    this.mesh = new THREE.Object3D();

    // 创建一个正方体
    // 这个形状会被复制创建云
    var geom = new THREE.BoxGeometry(20,20,20);
    var ball =new THREE.SphereGeometry(6.5, 20, 20);



    // 创建材质；一个简单的白色材质就可以达到效果
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.blue,
    });

    var matball = new THREE.MeshPhongMaterial({
        color:Colors.blue,
    });



    // 随机多次复制几何体
    var nBlocs = 3+Math.floor(Math.random()*20);
    for (var i=0; i<nBlocs; i++ ){

        // 通过复制几何体创建网格
        var m = new THREE.Mesh(geom, mat);
        var b = new THREE.Mesh(ball, matball);

        // 随机设置每个正方体的位置和旋转角度
        m.position.x = i*55;//改大数字   获得更加均匀的随机多边型分布
        m.position.y = Math.random()*50;
        m.position.z = Math.random()*10;
        m.rotation.z = Math.random()*Math.PI*2;
        m.rotation.y = Math.random()*Math.PI*2;

        b.position.x = i*55;//改大数字   获得更加均匀的随机多边型分布
        b.position.y = Math.random()*50;
        b.position.z = Math.random()*10;
        b.rotation.z = Math.random()*Math.PI*2;
        b.rotation.y = Math.random()*Math.PI*2;



        // 随机设置正方体的大小
        var s = .1 + Math.random()*.9;
        m.scale.set(s,s,s);
        b.scale.set(s,s,s);

        // 允许每个正方体生成投影和接收阴影
        m.castShadow = true;
        m.receiveShadow = true;
        b.castShadow = true;
        b.receiveShadow = true;

        // 将正方体添加入的容器中
        this.mesh.add(m,b);
    }
}

// 定义一个天空对象
Sky = function(){
    // 创建一个空的容器
    this.mesh = new THREE.Object3D();

    // 选取若干朵云散布在天空中
    this.nClouds = 250;

    // 把云均匀地散布
    // 需要根据统一的角度放置它们
    var stepAngle = Math.PI*2 / this.nClouds;

    // 创建云对象
    for(var i=0; i<this.nClouds; i++){
        var c = new Cloud();

        // 设置每朵云的旋转角度和位置
        // 因此使用了一点三角函数
        var a = stepAngle*i; //这是云的最终角度
        var h = 750 + Math.random()*1; // 这是轴的中心和云本身之间的距离

        //查左半个钟三角函数
        // 极坐标转换笛卡坐标
        c.mesh.position.y = Math.sin(a)*h;
        c.mesh.position.x = Math.cos(a)*h;
        //c.mesh.position.z = Math.cos(a)*h;

        // 根据云的位置旋转它
        c.mesh.rotation.z = a + Math.PI/2;

        // 我们把云放置在场景中的随机深度位置
        c.mesh.position.z = -400-Math.random()*2000;

        // 为每朵云设置一个随机大小
        var s = 1+Math.random()*2;
        c.mesh.scale.set(s,s,s);

        //将云的网格添加到场景中
        this.mesh.add(c.mesh);
    }
}

// 实例化天空对象，而且将它放置在屏幕中间稍微偏下的位置。

var sky;

function createSky(){
    sky = new Sky();
    //sky.mesh.position.x = -500;
    sky.mesh.position.y = -500;
    sky.mesh.position.z =1000 ;
    scene.add(sky.mesh);
}

var AirPlane = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "airPlane";

    // 创建驾驶舱
    var geomCockpitplay = new THREE.BoxGeometry(50, 40, 15, 1, 1, 1);
    var matCockpitplay = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var cockpitplay = new THREE.Mesh(geomCockpitplay, matCockpitplay);
    cockpitplay.position.y=15;
    cockpitplay.castShadow = true;
    cockpitplay.receiveShadow = true;
    this.mesh.add(cockpitplay);


    // 创建机舱
    var geomCockpit = new THREE.BoxGeometry(100, 60, 50, 1, 1, 1);
    var matCockpit = new THREE.MeshPhongMaterial({
        color: Colors.blue,
       shading: THREE.FlatShading
    });

    // 访问形状中顶点数组中一组特定的顶点
// 然后移动它的 x, y, z 属性:
    geomCockpit.vertices[4].y-=10;
    geomCockpit.vertices[4].z+=20;
    geomCockpit.vertices[5].y-=10;
    geomCockpit.vertices[5].z-=20;
    geomCockpit.vertices[6].y+=30;
    geomCockpit.vertices[6].z+=20;
    geomCockpit.vertices[7].y+=30;
    geomCockpit.vertices[7].z-=20;

    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // 创建引擎
    var geomEngine = new THREE.BoxGeometry(20, 40, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 50;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // 创建长机尾架子
    var geomTailPlanejiazi = new THREE.BoxGeometry(50, 20, 20, 1, 1, 1);
    var matTailPlanejiazi = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var tailPlanejiazi = new THREE.Mesh(geomTailPlanejiazi, matTailPlanejiazi);
    tailPlanejiazi.position.set(-70, 10, 0);
    tailPlanejiazi.castShadow = true;
    tailPlanejiazi.receiveShadow = true;
    this.mesh.add(tailPlanejiazi);
    // 创建机尾

    var geomTailPlane = new THREE.BoxGeometry(15, 10, 50, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-100, 20, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // 创建机翼
    var geomSideWing = new THREE.BoxGeometry(40, 8, 300, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    // 创建螺旋桨
    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // 创建螺旋桨的桨叶
    var geomBlade = new THREE.BoxGeometry(2, 100, 5, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        shading: THREE.FlatShading
    });

    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(65, 0, 0);
    this.mesh.add(this.propeller);
    //空气流
    //this.air.mesh.position.set(-10,27,0);
    //this.mesh.add(this.air.mesh);
};
var airplane;

//创建 空气流效果
var Air = function(){
    this.mesh = new THREE.Object3D();
    this.mesh.name = "air";

    // angleHairs是用于后面空气流的动画的属性
    this.angleairs=0;

    // 创建4边型
    var airGeom = new THREE.BoxGeometry(200,10,1);
    var airMat = new THREE.MeshLambertMaterial({
        color:Colors.white,
        transparent:true,
        opacity:.3,
        shading:THREE.FlatShading,});
    var air = new THREE.Mesh(airGeom, airMat);



    // 创建一个空气顶部的容器（这会有动画效果）
    this.airsTop = new THREE.Object3D();

    // 创建并放置他们在一个3*4的网格中
    for (var i=0; i<5;i++){
        var h = air.clone();
        var col = i%4;
        var row = Math.floor(i/0.1);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row*4, 0, startPosZ + col*4);
        this.airsTop.add(h);
    }
    // 创建一个空气的容器
    var airs2 =new THREE.Object3D();
    airs2.add(this.airsTop);
    airs2.position.set(-300,0,0);
    this.mesh.add(airs2);

}
var air
// 空气流动的动画
Air.prototype.updateair = function(){

    // 获得空气
    var hairs = this.airsTop.children;

    // 根据 angleairs 的角度更新空气
    var l = hairs.length;
    for (var i=0; i<l; i++){
        var h = hairs[i];
        // 每个空气块将周期性的基础上原始大小的0%至100%之间作调整。
        h.scale.y = .75 + Math.sin(this.angleairs+i/3)*-.75;
    }
    // 在下一帧增加角度
    this.angleairs += 0.1;
}




function createPlane(){
    airplane = new AirPlane();
    airplane.mesh.scale.set(.25,.25,.25);
    airplane.mesh.position.y = 100;
    scene.add(airplane.mesh);
}


//生成空气的方法
function createAir(){
    air = new Air();
    air.mesh.position.set(.25,.25,.25);
    scene.add(air.mesh);

    //this.air = new Air();
    //this.air.mesh.position.set(-10,27,0);
    //this.mesh.add(this.air.mesh);
}



//重新载入渲染
function loop(){

   // airplane.air.updateair();
    // 使螺旋桨旋转并转动大海和云
    sea.mesh.rotation.z += .004;
    sky.mesh.rotation.z += .007;


    //updateCameraFov();
    // 更新每帧的飞机
    updatePlane();

    updateairmain();
    // 更新每帧的空气
    air.updateair();
    sea.moveWaves();
    // 渲染场景
    renderer.render(scene, camera);

    // 重新调用 render() 函数
    requestAnimationFrame(loop);
}

var mousePos={x:0, y:0};

// mousemove 事件处理函数

function handleMouseMove(event) {

    // 将接收到的鼠标位置的值转换成归一化值，在-1与1之间变化  方便自己按比例调坐标
    // 这是x轴的公式:

    var tx = -1 + (event.clientX / WIDTH)*2;

    // 对于 y 轴，我们需要一个逆公式
    // 因为 2D 的 y 轴与 3D 的 y 轴方向相反

    var ty = 1 - (event.clientY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
    //console.log(mousePos);

    
}

function handleMouseMove(event) {

    // 将接收到的鼠标位置的值转换成归一化值，在-1与1之间变化  方便自己按比例调坐标
    // 这是x轴的公式:

    var tx = -1 + (event.clientX / WIDTH)*2;

    // 对于 y 轴，我们需要一个逆公式
    // 因为 2D 的 y 轴与 3D 的 y 轴方向相反

    var ty = 1 - (event.clientY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
    //console.log(mousePos);

    
}


// 拖拉 事件处理函数  好似无效  要绑元素id   先放弃
function handmousedown(event) {

    console.log("有效"+mousePos.x+'---'+mousePos.y);
}

function updatePlane(){
    var targetY = normalize(mousePos.y,-.75,.75,0, 175);
    var targetX = normalize(mousePos.x,-.75,.75,50, 300);

    // 在每帧通过添加剩余距离的一小部分的值移动飞机
    airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*0.1;
    airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*0.1;
    airplane.mesh.position.z+= (targetX-airplane.mesh.position.x)*0.1;

    // 剩余的距离按比例转动飞机
   airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*0.0128;
    airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*0.0064;
    airplane.mesh.rotation.y = (airplane.mesh.position.x-targetX)*0.0064;

    airplane.propeller.rotation.x += 0.8;
    //console.log( airplane.mesh.position.y+'---'+airplane.mesh.position.x+'---'+ airplane.mesh.position.z)
}


function updateairmain(){
    var targetY = normalize(mousePos.y,-.75,.75,0, 175);
    var targetX = normalize(mousePos.x,-.75,.75,50, 300);

    // 在每帧通过添加剩余距离的一小部分的值移动空气
    air.mesh.position.y += (targetY-air.mesh.position.y)*0.1;
    air.mesh.position.x += (targetX-air.mesh.position.x)*0.1;
    air.mesh.position.z+= (targetX-air.mesh.position.x)*0.1;

    // 剩余的距离按比例转动空气
    air.mesh.rotation.z = (targetY-air.mesh.position.y)*0.03;
    air.mesh.rotation.x = (air.mesh.position.y-targetY)*0.03;
    air.mesh.rotation.y = (air.mesh.position.x-targetX)*0.03;


    //console.log( airplane.mesh.position.y+'---'+airplane.mesh.position.x+'---'+ airplane.mesh.position.z)
}





var fov=0;
function mousewheel(e) {
    e.preventDefault();
    //e.stopPropagation();
    if (e.wheelDelta) {  //判断浏览器IE，谷歌滑轮事件
        if (e.wheelDelta > 0) { //当滑轮向上滚动时
           fov++;
           // console.log(fov);
        }
        if (e.wheelDelta < 0) { //当滑轮向下滚动时
            fov--;
           // console.log(fov);
        }
    } else if (e.detail) {  //Firefox滑轮事件
        if (e.detail > 0) { //当滑轮向上滚动时
            fov -= 1;
        }
        if (e.detail < 0) { //当滑轮向下滚动时
            fov += 1;
        }
    }



    camera.fov = normalize(fov/3,-2,2,40, 80);
    camera.updateProjectionMatrix();
}




//根据1到-1的范围   按比例去换算 实际飞机移动的坐标
function normalize(v,vmin,vmax,tmin, tmax){
    var nv = Math.max(Math.min(v,vmax), vmin);
    var dv = vmax-vmin;
    var pc = (nv-vmin)/dv;
    var dt = tmax-tmin;
    var tv = tmin + (pc*dt);
    return tv;
}


