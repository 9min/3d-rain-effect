class Rain {
  constructor({ target, resources: { cloud, drop, audio } }) {
    this.target = target;
    this.size = {
      width: Math.min(target.clientWidth, 1000),
      height: Math.min(target.clientHeight, 1000),
    };
    this.resources = { cloud, drop, audio };
    this.isMobile = false;
    this.audio = null;
    this.cloudParticles = [];
    this.rainCount = null;
    this.scene = null;
    this.camera = null;
    this.rain = null;
    this.rainGeometry = null;
    this.cloud = null;
    this.ambientLight = null;
    this.directionalLight = null;
    this.pointLight = null;
    this.renderer = null;
    this.lightningTimer = null;

    this.init();
  }

  init() {
    this.checkMobile();
    this.initAudio();
    this.initEvents();
    this.initRainCount();
    this.initScene();
    this.initCamera();
    this.initLoader();
    this.initAmbientLight();
    this.initDirectionalLight();
    this.initPointLight();
    this.initRain();
    this.initCloud();
    this.initRenderer();
    this.appendDom();
    this.animate();
  }

  checkMobile() {
    const mobileKeyWords = [
      'iPhone',
      'iPod',
      'BlackBerry',
      'Android',
      'Windows CE',
      'LG',
      'MOT',
      'SAMSUNG',
      'SonyEricsson',
      'Windows Phone',
    ];

    for (let word in mobileKeyWords) {
      if (navigator.userAgent.match(mobileKeyWords[word])) {
        this.isMobile = true;
        return;
      }
    }
  }

  initAudio() {
    const { audio } = this.resources;

    this.audio = new Audio(audio);
    this.audio.loop = true;
    this.audio.load();
  }

  initEvents() {
    this.target.addEventListener(this.isMobile
      ? 'touchend'
      : 'click',
      () => this.lightning(),
    );
  }

  initRainCount() {
    const { size: { width, height } } = this;

    this.rainCount = Math.floor((width * height) / 50);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x222233, 0.0015);
  }

  initCamera() {
    const { size: { width, height } } = this;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    this.camera.position.z = 1;
    this.camera.rotation.x = 1.16;
    this.camera.rotation.y = -0.12;
    this.camera.rotation.z = 0.27;
  }

  initLoader() {
    this.loader = new THREE.TextureLoader();
  }

  initAmbientLight() {
    this.ambientLight = new THREE.AmbientLight(0x666666);
    this.scene.add(this.ambientLight);
  }

  initDirectionalLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffeedd);
    this.directionalLight.position.set(0, 0, 1);
    this.scene.add(this.directionalLight);
  }

  initPointLight() {
    this.pointLight = new THREE.PointLight(0x062d89, 30, 500, 1.7);
    this.pointLight.position.set(200, 300, 100);
    this.scene.add(this.pointLight);
  }

  initRain() {
    this.rainGeometry = this.getRainGeometry();
    const rainMeterial = this.getRainMeterial();

    this.rain = new THREE.Points(this.rainGeometry, rainMeterial);
    this.scene.add(this.rain);
  }

  getRainGeometry() {
    const rainGeometry = new THREE.Geometry();

    for (let i = 0, len = this.rainCount; i < len; i++) {
      const randomX = Math.random() * 100 - 50;
      const randomY = Math.random() * 400 - 200;
      const randomZ = Math.random() * 400 - 300;
      const rainDrop = new THREE.Vector3(randomX, randomY, randomZ);

      rainDrop.originalX = randomX;
      rainDrop.originalZ = randomZ;
      rainDrop.velocity = 0;

      rainGeometry.vertices.push(rainDrop);
    }

    return rainGeometry;
  }

  getRainMeterial() {
    const { resources: { drop } } = this;

    return new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 1,
      map: this.loader.load(drop),
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: 1,
      transparent: true,
    });
  }

  initCloud() {
    const {
      size: { width, height },
      resources: { cloud },
    } = this;
    const cloudLength = Math.floor((width * height) / 10000);
    const cloudGeometry = new THREE.PlaneBufferGeometry(400, 400);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: this.loader.load(cloud),
      transparent: true,
    });

    for (let i = 0; i < cloudLength; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

      cloud.position.set(
        Math.random() * (width + 200) - 100,
        400,
        Math.random() * (height + 300) - (height + 100),
      );

      cloud.rotation.x = 1.16;
      cloud.rotation.y = -0.12;
      cloud.rotation.z = Math.random() * 360;
      cloud.material.opacity = 0.8;

      this.cloudParticles.push(cloud);
      this.scene.add(cloud);
    }
  }

  initRenderer() {
    const {
      scene: { fog: { color } },
      size: { width, height }
    } = this;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(width, height);
  }

  appendDom() {
    this.target.appendChild(this.renderer.domElement);
  }

  mute(isMute) {
    if (this.audio.currentTime === 0) {
      const promise = this.audio.play();

      if (!promise) {
        promise
          .then(() => this.audio.play())
          .catch(err => console.error(err));
      }
    }

    this.audio.muted = isMute ? true : false;
  }

  lightning() {
    if (this.lightningTimer) {
      clearTimeout(this.lightningTimer);
    }

    this.lightningTimer = setTimeout(() => this.lightningTimer = null, 1000);
  }

  animate() {
    const {
      cloudParticles,
      rainGeometry,
      pointLight,
      renderer,
      scene,
      camera,
    } = this;
    const isLightning = !!this.lightningTimer;

    cloudParticles.forEach((v) => {
      v.rotation.z -= 0.002;
    });

    rainGeometry.verticesNeedUpdate = true;
    rainGeometry.vertices.forEach((p) => {
      const rangeY = { min: Math.random() * 200 - 340, max: 200 };
      const rangeZ = { min: -50, max: 10 };

      p.velocity -= 0.5;

      if (rangeZ.min < p.originalZ && p.originalZ < rangeZ.max) {
        p.y += p.velocity / 2;
      } else {
        p.y += p.velocity;
      }

      if (p.y < rangeY.min) {
        p.y = rangeY.max;
        p.velocity = 0;
      }
    });

    if (isLightning || Math.random() > 0.8) {
      if (isLightning || pointLight.power < 100) {
        pointLight.position.set(
          Math.random() * 400,
          Math.random() * 200 + 300,
          100,
        );
      }
      pointLight.power = Math.random() * 500 + (isLightning ? 500 : 50);
    }

    renderer.render(scene, camera);
    
    requestAnimationFrame(() => this.animate());
  }
}
