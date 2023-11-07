import String from '@/components/IntrectiveComponents/String';
import React from 'react';
import styles from './page.module.css';
const testingPage = () => {
  return (
    <div>
      <div>testing Page</div>
      <div className={styles.container}>
        <div className={styles.body}>
          <String />
          <String />
          <String />
          <div className={styles.description}>
            <p>Smart Development</p>

            <p>
              Combining unique design and rich technology, we build digital
              products exactly as they were designed, without shortcuts or
              simplifications.
            </p>
          </div>

          <div className={styles.tagsContainer}>
            <p>Areas</p>

            <div className={styles.tags}>
              <p>E-commerce</p>

              <p>Finance</p>

              <p>Education</p>

              <p>Social</p>

              <p>Entertainment</p>

              <p>Medicine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default testingPage;
