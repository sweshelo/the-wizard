'use client';

import { LocalStorageHelper } from '@/service/local-storage';
import { useEffect, useState } from 'react';

export const ServerSelector = () => {
  const [address, setAddress] = useState<string | null>();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState<string | null>();

  useEffect(() => {
    const current = LocalStorageHelper.serverAddress();
    setAddress(current);
    setTempName(current);
  }, []);

  const handleStartEdit = () => {
    setIsEditing(true);
    setTempName(address);
  };

  const handleSave = () => {
    if (!tempName || tempName?.trim() === '') {
      alert('サーバアドレスを入力してください。');
      return;
    }

    LocalStorageHelper.setServerAddress(tempName.trim());
    setAddress(tempName?.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(address);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">接続サーバ</h3>
      <p className="text-xs text-gray-200 my-2">
        カスタムサーバに接続することで、より安定したゲームを楽しむことができます
      </p>
      <details className="border border-rounded p-1 my-2 text-sm">
        <summary>カスタムサーバの構築方法</summary>
        <p className="text-xs">
          <a href="https://bun.sh/">Bun</a>
          またはDockerが必要です。以下ではTailscaleを利用してリバースプロキシする例を紹介します。
          <br />
          1. ソースコードを <code>https://github.com/sweshelo/the-fool</code>{' '}
          からダウンロードしてREADME.mdの通りにセットアップします。
          <br />
          2. <a href="https://login.tailscale.com">Tailscale</a>
          に登録して、使用中の端末をセットアップします。
          <br />
          3. PowerShellなどから<pre>tailscale serve 5000</pre>
          を実行し、5000番ポートのサーバをリバースプロキシします。
          <br />
        </p>
      </details>

      {isEditing ? (
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={tempName || ''}
            onChange={e => setTempName(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="xxx.tailxxxxx.ts.net"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            保存
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-white text-lg">{address || 'default'}</span>
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            編集
          </button>
        </div>
      )}
    </div>
  );
};
