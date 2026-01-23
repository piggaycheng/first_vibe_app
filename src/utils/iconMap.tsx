import React from 'react';
import type { SvgIconProps } from '@mui/material';

// Dashboard / General
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import WebIcon from '@mui/icons-material/Web';
import LanguageIcon from '@mui/icons-material/Language';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import BugReportIcon from '@mui/icons-material/BugReport';

// User / Team
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import BadgeIcon from '@mui/icons-material/Badge';

// Content / Files
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Data / Charts
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableChartIcon from '@mui/icons-material/TableChart';
import StorageIcon from '@mui/icons-material/Storage';

// Communication
import EmailIcon from '@mui/icons-material/Email';
import ChatIcon from '@mui/icons-material/Chat';
import ForumIcon from '@mui/icons-material/Forum';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Commerce
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';

// Misc
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MapIcon from '@mui/icons-material/Map';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import ExtensionIcon from '@mui/icons-material/Extension';
import SecurityIcon from '@mui/icons-material/Security';

export const iconMap: Record<string, React.ElementType<SvgIconProps>> = {
  // General
  Dashboard: DashboardIcon,
  Home: HomeIcon,
  Settings: SettingsIcon,
  Info: InfoIcon,
  Analytics: AnalyticsIcon,
  Web: WebIcon,
  Language: LanguageIcon,
  Search: SearchIcon,
  Build: BuildIcon,
  Code: CodeIcon,
  BugReport: BugReportIcon,

  // User
  Person: PersonIcon,
  People: PeopleIcon,
  Group: GroupIcon,
  Badge: BadgeIcon,

  // Content
  Folder: FolderIcon,
  File: InsertDriveFileIcon,
  Article: ArticleIcon,
  Description: DescriptionIcon,
  Image: ImageIcon,
  Movie: MovieIcon,
  Receipt: ReceiptIcon,
  Assignment: AssignmentIcon,

  // Data
  BarChart: BarChartIcon,
  PieChart: PieChartIcon,
  ShowChart: ShowChartIcon,
  Timeline: TimelineIcon,
  TableChart: TableChartIcon,
  Storage: StorageIcon,

  // Communication
  Email: EmailIcon,
  Chat: ChatIcon,
  Forum: ForumIcon,
  Notifications: NotificationsIcon,
  Calendar: CalendarTodayIcon,

  // Commerce
  ShoppingCart: ShoppingCartIcon,
  Store: StoreIcon,
  Offer: LocalOfferIcon,
  Money: AttachMoneyIcon,
  CreditCard: CreditCardIcon,

  // Misc
  Star: StarIcon,
  Favorite: FavoriteIcon,
  Bookmark: BookmarkIcon,
  Map: MapIcon,
  Work: WorkIcon,
  School: SchoolIcon,
  Extension: ExtensionIcon,
  Security: SecurityIcon,
};

export const getIconComponent = (iconName?: string | null) => {
  if (!iconName) return null;
  return iconMap[iconName] || null;
};
