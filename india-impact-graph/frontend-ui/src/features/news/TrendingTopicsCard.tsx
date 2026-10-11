import React from 'react';
import styles from './TrendingTopicsCard.module.css';
import { TrendingTopicItem } from './types';

interface TrendingTopicsCardProps {
  topics: TrendingTopicItem[];
  onSelectTopic?: (topic: TrendingTopicItem) => void;
}

export const TrendingTopicsCard: React.FC<TrendingTopicsCardProps> = ({
  topics,
  onSelectTopic,
}) => {
  return (
    <div className={styles.cardContainer} data-testid="trending-topics-card">
      <div className={styles.titleGroup}>
        <h3 className={styles.cardTitle}>Trending Topics</h3>
        <p className={styles.cardSubtitle}>Most discussed themes</p>
      </div>

      <div className={styles.topicList} role="list">
        {topics.map((topic) => {
          let rankClass = '';
          if (topic.rank === 1) rankClass = styles.rankTop1;
          else if (topic.rank === 2) rankClass = styles.rankTop2;
          else if (topic.rank === 3) rankClass = styles.rankTop3;

          return (
            <div
              key={topic.rank}
              className={styles.topicItem}
              onClick={() => onSelectTopic && onSelectTopic(topic)}
              role="listitem"
              title={`Click to filter news by "${topic.name}"`}
              data-testid={`trending-topic-${topic.rank}`}
            >
              <div className={styles.topicLeft}>
                <span className={`${styles.rankBadge} ${rankClass}`}>
                  {topic.rank}
                </span>
                <div className={styles.topicMeta}>
                  <span className={styles.topicName}>{topic.name}</span>
                  <span className={styles.topicCount}>{topic.article_count_label}</span>
                </div>
              </div>

              <span className={styles.growthBadge}>{topic.growth_label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
