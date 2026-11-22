// frontend/src/components/Guardian3D.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Guardian3D = ({ mode = 'idle', passwordLength = 0 }) => {
  const mountRef = useRef(null);
  const stateRef = useRef({ mode, passwordLength });

  // نحدثو الحالة من غير ما نعاودو نبنيو المشهد الـ 3D من جديد
  useEffect(() => {
    stateRef.current = { mode, passwordLength };
  }, [mode, passwordLength]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. إنشاء المشهد، الكاميرا، والـ Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. الإضاءة
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 4, 20);
    pointLight1.position.set(4, 4, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x818cf8, 3, 20);
    pointLight2.position.set(-4, -3, 2);
    scene.add(pointLight2);

    // 3. المجسمات الـ 3D (النواة + الحلقات)
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // النواة الداخلية
    const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // الشبكة الخارجية (Wireframe)
    const cageGeo = new THREE.IcosahedronGeometry(1.45, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    mainGroup.add(cageMesh);

    // الحلقة الأولى
    const ring1Geo = new THREE.TorusGeometry(2.0, 0.03, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    // الحلقة الثانية
    const ring2Geo = new THREE.TorusGeometry(2.35, 0.02, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.6,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // جزيئات الفضاء المحيطة (Particles)
    const particlesCount = 90;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 9;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // 4. تتبع حركة الماوس
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 5. حلقة التحريك (Animation Loop - 60 FPS)
    let reqId;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const { mode: currentMode, passwordLength: pwdLen } = stateRef.current;

      // تحديد الألوان والسرعة حسب حالة الإدخال
      let targetColor = 0x0ea5e9; // أزرق عادي
      let speedMultiplier = 1 + Math.min(pwdLen * 0.15, 2.5);

      if (currentMode === 'password') {
        targetColor = 0xa855f7; // بنفسجي عند كتابة كلمة السر
        cageMesh.scale.setScalar(0.92 + Math.sin(elapsed * 5) * 0.03);
      } else if (currentMode === 'error') {
        targetColor = 0xef4444; // أحمر عند الخطأ
        mainGroup.position.x = Math.sin(elapsed * 45) * 0.12;
      } else if (currentMode === 'success') {
        targetColor = 0x10b981; // أخضر عند النجاح
        speedMultiplier = 3;
      } else {
        cageMesh.scale.setScalar(1);
        mainGroup.position.x = 0;
      }

      coreMat.color.lerp(new THREE.Color(targetColor), 0.08);
      cageMat.color.lerp(new THREE.Color(targetColor), 0.08);

      // دوران المجسمات
      coreMesh.rotation.y += 0.008 * speedMultiplier;
      coreMesh.rotation.x += 0.005 * speedMultiplier;
      cageMesh.rotation.y -= 0.006 * speedMultiplier;
      ring1.rotation.z += 0.012 * speedMultiplier;
      ring2.rotation.x -= 0.01 * speedMultiplier;
      particles.rotation.y = elapsed * 0.05;

      // تفاعل ناعم مع الماوس
      mainGroup.rotation.y += (mouse.x * 0.5 - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (-mouse.y * 0.5 - mainGroup.rotation.x) * 0.05;
      mainGroup.position.y = Math.sin(elapsed * 2) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 6. تعديل الحجم عند تغير الشاشة
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // التنظيف عند الخروج من الصفحة (Memory Cleanup)
    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full min-h-[360px]" />;
};

export default Guardian3D;