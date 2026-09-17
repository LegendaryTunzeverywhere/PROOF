import type { Language } from './translations';

type PageCopy = {
  reviews: {
    title: string;
    subtitle: string;
    queue: string;
    due: string;
    total: string;
    mastered: string;
    learning: string;
    struggling: string;
    dueToday: string;
    review: string;
    allCaughtUp: string;
    noDue: string;
    continueLearning: string;
    login: string;
    failed: string;
  };
  prove: {
    title: string;
    subtitle: string;
    login: string;
    failed: string;
    checkpoints: string;
    passed: string;
    scored: string;
    review: string;
    tryAgain: string;
    begin: string;
    preparing: string;
    emptyTitle: string;
    emptyBody: string;
    browse: string;
    sponsored: string;
    viewAll: string;
  };
  work: {
    title: string;
    subtitle: string;
    findWork: string;
    teach: string;
    sponsored: string;
    login: string;
    failed: string;
    recommended: string;
    noTasks: string;
    noTasksBody: string;
  };
};

const copy: Record<Language, PageCopy> = {
  en: {
    reviews: { title: 'Reviews', subtitle: 'Reinforce your knowledge with spaced repetition', queue: 'Your Review Queue', due: 'due today', total: 'total reviews', mastered: 'Mastered', learning: 'Learning', struggling: 'Struggling', dueToday: 'Due Today', review: 'Review', allCaughtUp: 'All caught up!', noDue: 'No reviews due today. Keep learning to add more topics to your review queue.', continueLearning: 'Continue Learning', login: 'Please log in to view your reviews', failed: 'Failed to load reviews' },
    prove: { title: 'Prove Your Skills', subtitle: 'Complete proof challenges to verify your knowledge and earn NIM rewards', login: 'Please log in to view proof challenges', failed: 'Failed to load challenges', checkpoints: 'Your Proof Checkpoints', passed: 'Passed', scored: 'Scored', review: 'Review proof', tryAgain: 'Try again', begin: 'Begin proof', preparing: 'Preparing proof…', emptyTitle: 'No proofs queued yet', emptyBody: 'Start a learning path to unlock proof checkpoints', browse: 'Browse Learning Paths', sponsored: 'Sponsored Challenges', viewAll: 'View All' },
    work: { title: 'Marketplace', subtitle: 'Find work, teach sessions, or join sponsored challenges', findWork: 'Find Work', teach: 'Teach', sponsored: 'Sponsored', login: 'Please log in to access the marketplace', failed: 'Failed to load marketplace data', recommended: 'Recommended Tasks', noTasks: 'No open tasks right now', noTasksBody: 'Check back soon for new opportunities' },
  },
  es: {
    reviews: { title: 'Repasos', subtitle: 'Refuerza tus conocimientos con repetición espaciada', queue: 'Tu cola de repasos', due: 'pendientes hoy', total: 'repasos totales', mastered: 'Dominados', learning: 'Aprendiendo', struggling: 'Difíciles', dueToday: 'Pendientes hoy', review: 'Repasar', allCaughtUp: '¡Todo al día!', noDue: 'No hay repasos pendientes hoy. Sigue aprendiendo para añadir más temas.', continueLearning: 'Continuar aprendiendo', login: 'Inicia sesión para ver tus repasos', failed: 'No se pudieron cargar los repasos' },
    prove: { title: 'Demuestra tus habilidades', subtitle: 'Completa desafíos para verificar tus conocimientos y ganar recompensas NIM', login: 'Inicia sesión para ver los desafíos', failed: 'No se pudieron cargar los desafíos', checkpoints: 'Tus puntos de prueba', passed: 'Aprobado', scored: 'Puntuación', review: 'Repasar prueba', tryAgain: 'Intentar de nuevo', begin: 'Comenzar prueba', preparing: 'Preparando prueba…', emptyTitle: 'Aún no hay pruebas', emptyBody: 'Comienza una ruta para desbloquear puntos de prueba', browse: 'Explorar rutas', sponsored: 'Desafíos patrocinados', viewAll: 'Ver todos' },
    work: { title: 'Mercado', subtitle: 'Encuentra trabajo, enseña o únete a desafíos patrocinados', findWork: 'Buscar trabajo', teach: 'Enseñar', sponsored: 'Patrocinados', login: 'Inicia sesión para acceder al mercado', failed: 'No se pudieron cargar los datos del mercado', recommended: 'Tareas recomendadas', noTasks: 'No hay tareas abiertas', noTasksBody: 'Vuelve pronto para ver nuevas oportunidades' },
  },
  fr: {
    reviews: { title: 'Révisions', subtitle: 'Renforcez vos connaissances avec la répétition espacée', queue: 'Votre file de révision', due: 'à faire aujourd’hui', total: 'révisions au total', mastered: 'Maîtrisées', learning: 'En cours', struggling: 'Difficiles', dueToday: 'À faire aujourd’hui', review: 'Réviser', allCaughtUp: 'Tout est à jour !', noDue: 'Aucune révision aujourd’hui. Continuez à apprendre pour ajouter des sujets.', continueLearning: 'Continuer à apprendre', login: 'Connectez-vous pour voir vos révisions', failed: 'Impossible de charger les révisions' },
    prove: { title: 'Prouvez vos compétences', subtitle: 'Complétez des défis pour vérifier vos connaissances et gagner des récompenses NIM', login: 'Connectez-vous pour voir les défis', failed: 'Impossible de charger les défis', checkpoints: 'Vos points de validation', passed: 'Réussi', scored: 'Score', review: 'Revoir la preuve', tryAgain: 'Réessayer', begin: 'Commencer la preuve', preparing: 'Préparation de la preuve…', emptyTitle: 'Aucune preuve en attente', emptyBody: 'Commencez un parcours pour débloquer des validations', browse: 'Parcourir les parcours', sponsored: 'Défis sponsorisés', viewAll: 'Tout voir' },
    work: { title: 'Marché', subtitle: 'Trouvez du travail, enseignez ou rejoignez des défis sponsorisés', findWork: 'Trouver du travail', teach: 'Enseigner', sponsored: 'Sponsorisé', login: 'Connectez-vous pour accéder au marché', failed: 'Impossible de charger les données du marché', recommended: 'Tâches recommandées', noTasks: 'Aucune tâche ouverte', noTasksBody: 'Revenez bientôt pour de nouvelles opportunités' },
  },
  de: {
    reviews: { title: 'Wiederholungen', subtitle: 'Festigen Sie Ihr Wissen mit verteiltem Lernen', queue: 'Ihre Wiederholungswarteschlange', due: 'heute fällig', total: 'Wiederholungen gesamt', mastered: 'Beherrscht', learning: 'Lernen', struggling: 'Schwierig', dueToday: 'Heute fällig', review: 'Wiederholen', allCaughtUp: 'Alles erledigt!', noDue: 'Heute sind keine Wiederholungen fällig. Lernen Sie weiter.', continueLearning: 'Weiterlernen', login: 'Bitte melden Sie sich an, um Wiederholungen zu sehen', failed: 'Wiederholungen konnten nicht geladen werden' },
    prove: { title: 'Beweisen Sie Ihre Fähigkeiten', subtitle: 'Schließen Sie Prüfungen ab, bestätigen Sie Ihr Wissen und verdienen Sie NIM', login: 'Bitte melden Sie sich an, um Prüfungen zu sehen', failed: 'Prüfungen konnten nicht geladen werden', checkpoints: 'Ihre Prüfungsmeilensteine', passed: 'Bestanden', scored: 'Punktzahl', review: 'Prüfung ansehen', tryAgain: 'Erneut versuchen', begin: 'Prüfung starten', preparing: 'Prüfung wird vorbereitet…', emptyTitle: 'Noch keine Prüfungen', emptyBody: 'Starten Sie einen Lernpfad, um Prüfungen freizuschalten', browse: 'Lernpfade durchsuchen', sponsored: 'Gesponserte Herausforderungen', viewAll: 'Alle anzeigen' },
    work: { title: 'Marktplatz', subtitle: 'Finden Sie Arbeit, unterrichten Sie oder nehmen Sie an gesponserten Prüfungen teil', findWork: 'Arbeit finden', teach: 'Lehren', sponsored: 'Gesponsert', login: 'Bitte melden Sie sich an, um den Marktplatz zu nutzen', failed: 'Marktdaten konnten nicht geladen werden', recommended: 'Empfohlene Aufgaben', noTasks: 'Derzeit keine offenen Aufgaben', noTasksBody: 'Schauen Sie bald wieder nach neuen Möglichkeiten' },
  },
  pt: {
    reviews: { title: 'Revisões', subtitle: 'Reforce seus conhecimentos com repetição espaçada', queue: 'Sua fila de revisões', due: 'pendentes hoje', total: 'revisões no total', mastered: 'Dominado', learning: 'Aprendendo', struggling: 'Difícil', dueToday: 'Pendentes hoje', review: 'Revisar', allCaughtUp: 'Tudo em dia!', noDue: 'Nenhuma revisão pendente hoje. Continue aprendendo.', continueLearning: 'Continuar aprendendo', login: 'Faça login para ver suas revisões', failed: 'Não foi possível carregar as revisões' },
    prove: { title: 'Comprove suas habilidades', subtitle: 'Complete desafios para verificar seu conhecimento e ganhar recompensas NIM', login: 'Faça login para ver os desafios', failed: 'Não foi possível carregar os desafios', checkpoints: 'Seus pontos de prova', passed: 'Aprovado', scored: 'Pontuação', review: 'Revisar prova', tryAgain: 'Tentar novamente', begin: 'Começar prova', preparing: 'Preparando prova…', emptyTitle: 'Nenhuma prova na fila', emptyBody: 'Comece um caminho para desbloquear pontos de prova', browse: 'Explorar caminhos', sponsored: 'Desafios patrocinados', viewAll: 'Ver tudo' },
    work: { title: 'Mercado', subtitle: 'Encontre trabalho, ensine ou participe de desafios patrocinados', findWork: 'Encontrar trabalho', teach: 'Ensinar', sponsored: 'Patrocinado', login: 'Faça login para acessar o mercado', failed: 'Não foi possível carregar os dados do mercado', recommended: 'Tarefas recomendadas', noTasks: 'Nenhuma tarefa aberta agora', noTasksBody: 'Volte em breve para novas oportunidades' },
  },
  zh: {
    reviews: { title: '复习', subtitle: '通过间隔重复巩固你的知识', queue: '你的复习队列', due: '今日到期', total: '复习总数', mastered: '已掌握', learning: '学习中', struggling: '困难', dueToday: '今日待复习', review: '复习', allCaughtUp: '全部完成！', noDue: '今天没有待复习内容。继续学习以添加更多主题。', continueLearning: '继续学习', login: '请登录以查看复习内容', failed: '无法加载复习内容' },
    prove: { title: '证明你的技能', subtitle: '完成证明挑战以验证知识并赚取 NIM 奖励', login: '请登录以查看证明挑战', failed: '无法加载挑战', checkpoints: '你的证明节点', passed: '已通过', scored: '得分', review: '复习证明', tryAgain: '重试', begin: '开始证明', preparing: '正在准备证明…', emptyTitle: '暂无排队中的证明', emptyBody: '开始学习路径以解锁证明节点', browse: '浏览学习路径', sponsored: '赞助挑战', viewAll: '查看全部' },
    work: { title: '市场', subtitle: '寻找工作、教学或参加赞助挑战', findWork: '寻找工作', teach: '教学', sponsored: '赞助', login: '请登录以访问市场', failed: '无法加载市场数据', recommended: '推荐任务', noTasks: '目前没有开放任务', noTasksBody: '稍后回来查看新的机会' },
  },
};

export function getPageCopy(language: Language): PageCopy {
  return copy[language];
}
