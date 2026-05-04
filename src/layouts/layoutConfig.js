function buildFooterSections({ isAuthenticated, isAdmin }) {
  const sections = [
    {
      title: 'Explorar',
      links: [
        { to: '/gallery', label: 'Galería' },
        { to: isAuthenticated ? '/app/contests' : '/contests', label: 'Concursos' },
      ],
    },
    {
      title: isAuthenticated ? 'Cuenta' : 'Acceso',
      links: isAuthenticated
        ? [
            { to: '/app/profile', label: 'Perfil' },
            { to: '/app/photos/upload', label: 'Subir foto' },
          ]
        : [
            { to: '/login', label: 'Iniciar sesión' },
            { to: '/register', label: 'Crear cuenta' },
          ],
    },
    {
      title: 'Plataforma',
      bullets: [
        'Retos semanales por temática',
        'Votaciones abiertas en tiempo real',
        isAdmin ? 'Gestión administrativa disponible' : 'Seguimiento de ranking histórico',
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '/legal-notice', label: 'Aviso Legal' },
        { to: '/privacy-policy', label: 'Política de Privacidad' },
        { to: '/cookie-policy', label: 'Política de Cookies' },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: 'Administración',
      links: [{ to: '/app/admin', label: 'Panel de administración' }],
    });
  }

  return sections;
}

export function createPublicLayoutConfig() {
  return {
    homeTo: '/gallery',
    navItems: [
      { to: '/gallery', label: 'Galería', end: true },
      { to: '/contests', label: 'Concursos', end: true },
      { to: '/login', label: 'Acceso', end: true },
    ],
    authActions: [
      { to: '/login', label: 'Iniciar sesión', variant: 'ghost' },
      { to: '/register', label: 'Crear cuenta', variant: 'primary' },
    ],
    footerSections: buildFooterSections({ isAuthenticated: false, isAdmin: false }),
  };
}

export function createPrivateLayoutConfig({ user, onLogout }) {
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: '/app/dashboard', label: 'Galería' },
    { to: '/app/contests', label: 'Concursos' },
    { to: '/app/photos/upload', label: 'Subir foto' },
    { to: '/app/profile', label: 'Perfil' },
  ];

  if (isAdmin) {
    navItems.push({ to: '/app/admin', label: 'Admin' });
  }

  return {
    homeTo: '/app/dashboard',
    navItems,
    user,
    onLogout,
    footerSections: buildFooterSections({ isAuthenticated: true, isAdmin }),
  };
}
