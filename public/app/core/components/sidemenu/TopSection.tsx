import React, { FC } from 'react';
import _ from 'lodash';
import TopSectionItem from './TopSectionItem';
import config from '../../config';
import { getLocationSrv } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';
import { HM_FRONT_URL } from 'app/const/health-monitor';

const TopSection: FC<any> = () => {
  const excludeNavItemIds = ['create', 'dashboards', 'explore', 'alerting', 'admin'];
  const navTree = _.cloneDeep(config.bootData.navTree);
  const mainLinks = _.filter(navTree, item => !item.hideFromMenu && !excludeNavItemIds.includes(item.id));
  const searchLink = {
    text: 'Search',
    icon: 'search',
  };

  if (contextSrv.isSignedIn && contextSrv.user.isGrafanaAdmin === true) {
    const cfg = _.find(mainLinks, x => x.id === 'cfg');

    if (cfg) {
      cfg.children = [];
      cfg.url = HM_FRONT_URL;
    }
  }

  const onOpenSearch = () => {
    getLocationSrv().update({ query: { search: 'open' }, partial: true });
  };

  return (
    <div className="sidemenu__top">
      <TopSectionItem link={searchLink} onClick={onOpenSearch} />
      {mainLinks.map((link, index) => {
        return <TopSectionItem link={link} key={`${link.id}-${index}`} />;
      })}
    </div>
  );
};

export default TopSection;
