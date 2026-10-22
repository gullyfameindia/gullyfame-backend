const Competition = require("../models/Competition");
const Reel = require("../models/Reel");
const BannerService = require("../services/BannerService");
const CategoryService = require("../services/CategoryService");
const ChampionService = require("../services/ChampionService");
const GamificationService = require("../services/GamificationService");
const DailyMissionService = require("../services/DailyMissionService");

module.exports = () => {
  const homeScreen = async (req, res, next) => {
    console.log("HomeScreenController => homeScreen");
    const { userId } = req.body;

    const liveCompsQuery = Competition.find({
      status: { $in: ["LIVE", "live"] },
      isActive: true,
      isDeleted: { $ne: true },
    })
      .select("_id title startDate endDate image prizePool participants")
      .lean();

    const upcomingCompsQuery = Competition.find({
      status: { $in: ["UPCOMING", "CREATED", "APPROVED"] },
      isActive: true,
      isDeleted: { $ne: true },
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(5)
      .select("_id title image prizePool endDate participants")
      .lean();

    const pastCompsQuery = Competition.find({
      status: { $in: ["ENDED", "COMPLETED"] },
      isActive: true,
      isDeleted: { $ne: true },
    })
      .sort({ endDate: -1 })
      .limit(5)
      .select("_id title image totalViews")
      .lean();

    const trendingReelsQuery = Reel.find({
      isActive: true,
      isDeleted: { $ne: true },
      status: { $ne: "draft" },
    })
      .sort({ "stats.votes": -1, "stats.likes": -1 })
      .limit(6)
      .populate("author", "_id firstName lastName username")
      .lean();

    const [
      banners,
      categoriesRaw,
      liveComps,
      upcomingComps,
      pastComps,
      trendingReels,
      champions,
      progress,
      dailyMission,
    ] = await Promise.all([
      BannerService().getBannersHomeScreen({ isActive: true }, 1, 10),
      CategoryService().getCategory({ isActive: true }, 1, 10),
      liveCompsQuery,
      upcomingCompsQuery,
      pastCompsQuery,
      trendingReelsQuery,
      ChampionService().getChampions(1, 3),
      GamificationService().getProgress(userId),
      DailyMissionService().getOrCreateToday(userId),
    ]);

    const liveCompetitions = liveComps.map((comp) => ({
      id: comp._id,
      title: comp.title,
      startDate: comp.startDate,
      endDate: comp.endDate,
      participants: comp.participants ? comp.participants.length : 0,
      prize: comp.prizePool,
      image: comp.image,
    }));

    req.rData = {
      banners: (banners || []).map((b, idx) => ({
        id: idx + 1,
        title: b.title,
        subtitle: "",
        image: b.banner,
      })),

      categories: (categoriesRaw || []).map((cat) => ({
        id: cat._id,
        name: cat.name,
        icon: cat.icon || "",
      })),

      trending: (trendingReels || []).map((reel) => ({
        id: reel._id,
        title: reel.caption || "",
        views: reel.stats?.votes || 0,
        image: reel.thumbnail_url || "",
        likes: reel.stats?.likes || 0,
      })),

      upcomingCompetitions: (upcomingComps || []).map((comp) => ({
        id: comp._id,
        title: comp.title,
        prize: comp.prizePool,
        image: comp.image,
        endDate: comp.endDate,
        participants: comp.participants ? comp.participants.length : 0,
      })),

      pastCompetitions: (pastComps || []).map((comp) => ({
        id: comp._id,
        title: comp.title,
        views: comp.totalViews || 0,
        image: comp.image,
      })),

      topCompetitors: (champions.champions || []).map((c) => ({
        rank: c.rank,
        name: c.name,
        points: c.totalVotes,
        image: c.profilePictureUrl,
      })),

      liveCompetitions,

      // Gamification strip ("Street Hustler · Level 12", "5 Day Streak", XP bar)
      progress,

      // "DAILY MISSION — Vote on 5 videos (n/5)" tracker
      dailyMission: {
        target: dailyMission.target,
        current: dailyMission.current,
        completed: dailyMission.completed,
      },
    };

    req.msg = "success";
    next();
  };

  const getAdminDashboard = async (req, res, next) => {
    console.log("HomeScreenController => homeScreen");

    req.rData = {
      banners: [
        {
          id: 1,
          title: "Festive Fashion Specials",
          subtitle: "Big Styles, Big Savings!",
          image: "/images/banners/festive1.png",
        },
        {
          id: 2,
          title: "Mega Sale",
          subtitle: "50% OFF on All Brands",
          image: "/images/banners/festive2.png",
        },
      ],

      categories: [
        {
          id: 1,
          name: "Music",
          icon: "/images/categories/music.png",
        },
        {
          id: 2,
          name: "Dance",
          icon: "/images/categories/dance.png",
        },
        {
          id: 3,
          name: "Cooking",
          icon: "/images/categories/cooking.png",
        },
        {
          id: 4,
          name: "Comedy",
          icon: "/images/categories/comedy.png",
        },
      ],

      trending: [
        {
          id: 101,
          title: "Dance-Off Delhi",
          category: "Dance",
          views: 214000,
          image: "/images/trending/dance-off.png",
          likes: 136,
        },
        {
          id: 102,
          title: "Gully Chef Wars",
          category: "Cooking",
          views: 98000,
          image: "/images/trending/chef-wars.png",
          likes: 82,
        },
        {
          id: 103,
          title: "Mic-Drop Battle",
          category: "Music",
          views: 143000,
          image: "/images/trending/mic-drop.png",
          likes: 117,
        },
      ],

      upcomingCompetitions: [
        {
          id: 201,
          title: "Hip-Hop Championship 2025",
          prize: 5000,
          image: "/images/upcoming/hiphop.png",
          endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 500,
        },
        {
          id: 202,
          title: "Cooking Wars",
          prize: 5000,
          image: "/images/upcoming/cooking.png",
          endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 500,
        },
        {
          id: 203,
          title: "Sangeet Ka Mahasangram",
          prize: 3000,
          image: "/images/upcoming/sangeet.png",
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 500,
        },
      ],

      pastCompetitions: [
        {
          id: 301,
          title: "Hip-Hop Championship 2024",
          views: 89000,
          image: "/images/past/hiphop-past.png",
          winner: "test",
        },
        {
          id: 302,
          title: "Cooking Wars Finale",
          views: 55000,
          image: "/images/past/cooking-past.png",
          winner: "test",
        },
        {
          id: 303,
          title: "Sangeet Final Round",
          views: 74000,
          image: "/images/past/sangeet-past.png",
          winner: "test",
        },
      ],

      topCompetitors: [
        {
          rank: 1,
          name: "Bryan Wolf",
          points: 453,
          image: "/images/competitors/bryan.png",
        },
        {
          rank: 2,
          name: "Meghan Joseph",
          points: 409,
          image: "/images/competitors/meghan.png",
        },
        {
          rank: 3,
          name: "Alex Turner",
          points: 376,
          image: "/images/competitors/alex.png",
        },
      ],
    };

    req.msg = "success";
    next();
  };

  return {
    homeScreen,
    getAdminDashboard,
  };
};
