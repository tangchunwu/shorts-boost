import { Platform } from './types';

export interface TitleTemplate {
  id: string;
  template: string;
  category: string;
  platforms: Platform[];
  example: string;
}

export const TEMPLATE_CATEGORIES = [
  { id: 'curiosity', label: '好奇心', icon: '🤔' },
  { id: 'howto', label: '教程型', icon: '📚' },
  { id: 'list', label: '清单型', icon: '📋' },
  { id: 'story', label: '故事型', icon: '📖' },
  { id: 'controversy', label: '争议型', icon: '🔥' },
  { id: 'emotion', label: '情感型', icon: '💖' },
];

export const TITLE_TEMPLATES: TitleTemplate[] = [
  // 好奇心型
  { id: '1', template: '99%的人不知道的{主题}秘密', category: 'curiosity', platforms: ['douyin', 'kuaishou', 'xiaohongshu', 'bilibili'], example: '99%的人不知道的护肤秘密' },
  { id: '2', template: '原来{主题}还能这样用？', category: 'curiosity', platforms: ['douyin', 'kuaishou', 'xiaohongshu'], example: '原来吹风机还能这样用？' },
  { id: '3', template: '{主题}的真相，看完你就懂了', category: 'curiosity', platforms: ['douyin', 'bilibili'], example: '减肥的真相，看完你就懂了' },
  { id: '4', template: '为什么{对象}都在偷偷{动作}？', category: 'curiosity', platforms: ['douyin', 'xiaohongshu'], example: '为什么明星都在偷偷喝这个？' },
  { id: '5', template: '我发现了{主题}的隐藏功能！', category: 'curiosity', platforms: ['douyin', 'kuaishou', 'bilibili'], example: '我发现了微信的隐藏功能！' },
  
  // 教程型
  { id: '6', template: '3步教你{动作}，新手也能学会', category: 'howto', platforms: ['douyin', 'kuaishou', 'xiaohongshu', 'bilibili'], example: '3步教你画眼线，新手也能学会' },
  { id: '7', template: '手把手教你{主题}，保姆级教程', category: 'howto', platforms: ['douyin', 'xiaohongshu', 'bilibili'], example: '手把手教你做蛋糕，保姆级教程' },
  { id: '8', template: '{时间}学会{技能}，零基础入门', category: 'howto', platforms: ['douyin', 'bilibili'], example: '7天学会吉他，零基础入门' },
  { id: '9', template: '一分钟学会{技能}，太简单了！', category: 'howto', platforms: ['douyin', 'kuaishou'], example: '一分钟学会这个拍照姿势，太简单了！' },
  { id: '10', template: '{人群}必看！{主题}完整攻略', category: 'howto', platforms: ['xiaohongshu', 'bilibili'], example: '大学生必看！省钱完整攻略' },
  
  // 清单型
  { id: '11', template: '{数量}个{主题}推荐，第{N}个绝了', category: 'list', platforms: ['douyin', 'xiaohongshu', 'bilibili'], example: '5个平价护肤品推荐，第3个绝了' },
  { id: '12', template: '盘点{数量}个{主题}，你用过几个？', category: 'list', platforms: ['douyin', 'kuaishou', 'bilibili'], example: '盘点10个童年零食，你吃过几个？' },
  { id: '13', template: '{年份}年度{主题}TOP{数量}', category: 'list', platforms: ['bilibili', 'xiaohongshu'], example: '2024年度好用面膜TOP5' },
  { id: '14', template: '{价格}以内最值得买的{数量}样东西', category: 'list', platforms: ['xiaohongshu', 'douyin'], example: '50元以内最值得买的3样东西' },
  
  // 故事型
  { id: '15', template: '我花了{时间/金额}，终于{成果}', category: 'story', platforms: ['douyin', 'xiaohongshu', 'bilibili'], example: '我花了3个月，终于减掉20斤' },
  { id: '16', template: '从{起点}到{终点}，我的{主题}之路', category: 'story', platforms: ['bilibili', 'xiaohongshu'], example: '从月薪3000到月入3万，我的副业之路' },
  { id: '17', template: '{时间}前的我 VS 现在的我', category: 'story', platforms: ['douyin', 'xiaohongshu'], example: '一年前的我 VS 现在的我' },
  { id: '18', template: '当我开始{动作}后，生活彻底变了', category: 'story', platforms: ['douyin', 'xiaohongshu', 'bilibili'], example: '当我开始早起后，生活彻底变了' },
  
  // 争议型
  { id: '19', template: '{主题}到底值不值？我来告诉你真相', category: 'controversy', platforms: ['douyin', 'bilibili'], example: '网红餐厅到底值不值？我来告诉你真相' },
  { id: '20', template: '别再{错误做法}了！正确方法是这样', category: 'controversy', platforms: ['douyin', 'kuaishou', 'xiaohongshu'], example: '别再这样洗脸了！正确方法是这样' },
  { id: '21', template: '{主题}的{数量}大误区，你中了几个？', category: 'controversy', platforms: ['douyin', 'xiaohongshu', 'bilibili'], example: '护肤的5大误区，你中了几个？' },
  { id: '22', template: '为什么我劝你不要{动作}？', category: 'controversy', platforms: ['douyin', 'bilibili'], example: '为什么我劝你不要跟风买这个？' },
  
  // 情感型
  { id: '23', template: '看完这个，我哭了…', category: 'emotion', platforms: ['douyin', 'kuaishou'], example: '看完这个，我哭了…' },
  { id: '24', template: '每个{人群}都该看看这个', category: 'emotion', platforms: ['douyin', 'kuaishou', 'bilibili'], example: '每个打工人都该看看这个' },
  { id: '25', template: '这大概是我见过最{形容词}的{主题}', category: 'emotion', platforms: ['douyin', 'xiaohongshu'], example: '这大概是我见过最治愈的画面' },
  { id: '26', template: '如果你也{状态}，一定要看完', category: 'emotion', platforms: ['douyin', 'xiaohongshu', 'bilibili'], example: '如果你也在迷茫，一定要看完' },
];
