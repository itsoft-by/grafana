// Libaries
import React, { PureComponent, FC, ReactNode } from 'react';
import { connect } from 'react-redux';
import { css } from 'emotion';
// Utils & Services
import { appEvents } from 'app/core/app_events';
import { PlaylistSrv } from 'app/features/playlist/playlist_srv';
// Components
import { DashNavButton } from './DashNavButton';
import { DashNavTimeControls } from './DashNavTimeControls';
import { Icon, ModalsController } from '@grafana/ui';
import { textUtil } from '@grafana/data';
import { BackButton } from 'app/core/components/BackButton/BackButton';
// State
import { updateLocation } from 'app/core/actions';
// Types
import { DashboardModel } from '../../state';
import { CoreEvents, StoreState } from 'app/types';
import { ShareModal } from 'app/features/dashboard/components/ShareModal';
import { SaveDashboardModalProxy } from 'app/features/dashboard/components/SaveDashboard/SaveDashboardModalProxy';
// Constants
import { HM_BACK_URL } from 'app/const/health-monitor';

import { contextSrv } from 'app/core/services/context_srv';

export interface OwnProps {
  dashboard: DashboardModel;
  isFullscreen: boolean;
  $injector: any;
  updateLocation: typeof updateLocation;
  onAddPanel: () => void;
}

interface DashNavButtonModel {
  show: (props: Props) => boolean;
  component: FC<Partial<Props>>;
  index?: number | 'end';
}

interface KeyValuePair<T, T1> {
  key: T;
  value: T1;
}

const customLeftActions: DashNavButtonModel[] = [];
const customRightActions: DashNavButtonModel[] = [];

export function addCustomLeftAction(content: DashNavButtonModel) {
  customLeftActions.push(content);
}

export function addCustomRightAction(content: DashNavButtonModel) {
  customRightActions.push(content);
}

export interface StateProps {
  location: any;
}

type Props = StateProps & OwnProps;

class DashNav extends PureComponent<Props> {
  playlistSrv: PlaylistSrv;

  constructor(props: Props) {
    super(props);
    this.playlistSrv = this.props.$injector.get('playlistSrv');
  }

  onFolderNameClick = () => {
    this.props.updateLocation({
      query: { search: 'open', folder: 'current' },
      partial: true,
    });
  };

  onClose = () => {
    this.props.updateLocation({
      query: { viewPanel: null },
      partial: true,
    });
  };

  onToggleTVMode = () => {
    appEvents.emit(CoreEvents.toggleKioskMode);
  };

  onOpenSettings = () => {
    this.props.updateLocation({
      query: { editview: 'settings' },
      partial: true,
    });
  };

  onStarDashboard = () => {
    const { dashboard, $injector } = this.props;
    const dashboardSrv = $injector.get('dashboardSrv');

    dashboardSrv.starDashboard(dashboard.id, dashboard.meta.isStarred).then((newState: any) => {
      dashboard.meta.isStarred = newState;
      this.forceUpdate();
    });
  };

  onPlaylistPrev = () => {
    this.playlistSrv.prev();
  };

  onPlaylistNext = () => {
    this.playlistSrv.next();
  };

  onPlaylistStop = () => {
    this.playlistSrv.stop();
    this.forceUpdate();
  };

  onDashboardNameClick = () => {
    this.props.updateLocation({
      query: { search: 'open' },
      partial: true,
    });
  };

  addCustomContent(actions: DashNavButtonModel[], buttons: ReactNode[]) {
    actions.map((action, index) => {
      const Component = action.component;
      const element = <Component {...this.props} key={`button-custom-${index}`} />;
      typeof action.index === 'number' ? buttons.splice(action.index, 0, element) : buttons.push(element);
    });
  }

  renderLeftActionsButton() {
    const { dashboard } = this.props;
    const { canStar, canShare, isStarred } = dashboard.meta;

    const buttons: ReactNode[] = [];
    if (canStar) {
      buttons.push(
        <DashNavButton
          tooltip="Mark as favorite"
          classSuffix="star"
          icon={isStarred ? 'favorite' : 'star'}
          iconType={isStarred ? 'mono' : 'default'}
          iconSize="lg"
          noBorder={true}
          onClick={this.onStarDashboard}
          key="button-star"
        />
      );
    }

    if (canShare) {
      buttons.push(
        <ModalsController key="button-share">
          {({ showModal, hideModal }) => (
            <DashNavButton
              tooltip="Share dashboard"
              classSuffix="share"
              icon="share-alt"
              iconSize="lg"
              noBorder={true}
              onClick={() => {
                showModal(ShareModal, {
                  dashboard,
                  onDismiss: hideModal,
                });
              }}
            />
          )}
        </ModalsController>
      );
    }

    this.addCustomContent(customLeftActions, buttons);
    return buttons;
  }

  renderDashboardTitleSearchButton() {
    const { dashboard, isFullscreen } = this.props;

    const folderSymbol = css`
      margin-right: 0 4px;
    `;
    const mainIconClassName = css`
      margin-right: 8px;
      margin-bottom: 3px;
    `;

    const folderTitle = dashboard.meta.folderTitle;
    const haveFolder = dashboard.meta.folderId > 0;

    return (
      <>
        <div>
          <div className="navbar-page-btn">
            {!isFullscreen && <Icon name="apps" size="lg" className={mainIconClassName} />}
            {haveFolder && (
              <>
                <a className="navbar-page-btn__folder" onClick={this.onFolderNameClick}>
                  {folderTitle} <span className={folderSymbol}>/</span>
                </a>
              </>
            )}
            <a onClick={this.onDashboardNameClick}>{dashboard.title}</a>
          </div>
        </div>
        <div className="navbar-buttons navbar-buttons--actions">{this.renderLeftActionsButton()}</div>
        <div className="navbar__spacer" />
      </>
    );
  }

  renderBackButton() {
    return (
      <div className="navbar-edit">
        <BackButton surface="dashboard" onClick={this.onClose} />
      </div>
    );
  }

  renderRightActionsButton() {
    const { dashboard, onAddPanel } = this.props;
    const { canSave, showSettings } = dashboard.meta;
    const { snapshot } = dashboard;
    const snapshotUrl = snapshot && snapshot.originalUrl;

    const buttons: ReactNode[] = [];
    if (canSave) {
      buttons.push(
        <DashNavButton
          classSuffix="save"
          tooltip="Add panel"
          icon="panel-add"
          onClick={onAddPanel}
          iconType="mono"
          iconSize="xl"
          key="button-panel-add"
        />
      );
      buttons.push(
        <ModalsController key="button-save">
          {({ showModal, hideModal }) => (
            <DashNavButton
              tooltip="Save dashboard"
              classSuffix="save"
              icon="save"
              onClick={() => {
                showModal(SaveDashboardModalProxy, {
                  dashboard,
                  onDismiss: hideModal,
                });
              }}
            />
          )}
        </ModalsController>
      );
    }

    if (snapshotUrl) {
      buttons.push(
        <DashNavButton
          tooltip="Open original dashboard"
          classSuffix="snapshot-origin"
          href={textUtil.sanitizeUrl(snapshotUrl)}
          icon="link"
          key="button-snapshot"
        />
      );
    }

    if (showSettings) {
      buttons.push(
        <DashNavButton
          tooltip="Dashboard settings"
          classSuffix="settings"
          icon="cog"
          onClick={this.onOpenSettings}
          key="button-settings"
        />
      );
    }

    this.addCustomContent(customRightActions, buttons);
    return buttons;
  }

  exportToPdf = () => {
    const { dashboard } = this.props;
    const vm = {
      panelIds: dashboard.panels.filter(x => x.type !== 'row').map(x => x.id), // get only panel ids
      variables: collectDashboardVariables(dashboard.getVariables()),
      uid: dashboard.uid,
      refresh: dashboard.refresh,
      from: dashboard.time.from,
      to: dashboard.time.to,
      title: dashboard.title,
      user: contextSrv.user.login,
    };

    fetch(`${HM_BACK_URL}pdf/render`, {
      method: 'POST',
      body: JSON.stringify(vm),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }

        return Promise.reject(response);
      })
      .then(file => {
        const blob = base64toBlob(file.fileContents, 'application/pdf');
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', file.fileDownloadName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      });
  };
  render() {
    const { dashboard, location, isFullscreen } = this.props;

    return (
      <div className="navbar">
        {isFullscreen && this.renderBackButton()}
        {this.renderDashboardTitleSearchButton()}

        {this.playlistSrv.isPlaying && (
          <div className="navbar-buttons navbar-buttons--playlist">
            <DashNavButton
              tooltip="Go to previous dashboard"
              classSuffix="tight"
              icon="step-backward"
              onClick={this.onPlaylistPrev}
            />
            <DashNavButton
              tooltip="Stop playlist"
              classSuffix="tight"
              icon="square-shape"
              onClick={this.onPlaylistStop}
            />
            <DashNavButton
              tooltip="Go to next dashboard"
              classSuffix="tight"
              icon="forward"
              onClick={this.onPlaylistNext}
            />
          </div>
        )}

        <div className="navbar-buttons navbar-buttons--actions">{this.renderRightActionsButton()}</div>

        <div className="navbar-buttons navbar-buttons--tv">
          <DashNavButton tooltip="Cycle view mode" classSuffix="tv" icon="monitor" onClick={this.onToggleTVMode} />
        </div>

        <div className="navbar-buttons navbar-buttons--tv">
          <DashNavButton tooltip="Export to pdf" classSuffix="tv" icon="save" onClick={this.exportToPdf} />
        </div>

        {!dashboard.timepicker.hidden && (
          <div className="navbar-buttons">
            <DashNavTimeControls dashboard={dashboard} location={location} updateLocation={updateLocation} />
          </div>
        )}
      </div>
    );
  }
}

const collectDashboardVariables = (dashboardVariables: any): Array<KeyValuePair<string, string[]>> => {
  let result: Array<KeyValuePair<string, string[]>> = [];

  dashboardVariables.forEach((x: any) => {
    const value = typeof x.current.value === 'string' ? [x.current.value] : x.current.value;
    const variable: KeyValuePair<string, string[]> = {
      key: `var-${x.name}`,
      value: value,
    };

    result.push(variable);
  });

  return result;
};

const base64toBlob = (b64Data: string, contentType: string = '', sliceSize: number = 512): Blob => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

const mapStateToProps = (state: StoreState) => ({
  location: state.location,
});

const mapDispatchToProps = {
  updateLocation,
};

export default connect(mapStateToProps, mapDispatchToProps)(DashNav);
